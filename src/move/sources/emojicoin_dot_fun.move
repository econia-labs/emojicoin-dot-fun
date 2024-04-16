// cspell:words blackpaper
module emojicoin_dot_fun::emojicoin_dot_fun {

    use aptos_framework::coin;
    use aptos_framework::event;
    use aptos_framework::object::{Self, ExtendRef, ObjectGroup};
    use aptos_std::smart_table::{Self, SmartTable};
    use emojicoin_dot_fun::hex_codes;
    use std::signer;

    #[test_only] use std::aptos_account;
    #[test_only] use std::vector;

    const MAX_SYMBOL_LENGTH: u8 = 10;

    const U64_MAX_AS_u128: u128 = 0xffffffffffffffff;
    const BASIS_POINTS_PER_UNIT: u128 = 10_000;

    // Generated automatically by blackpaper calculations script.
    const MARKET_CAP: u64 = 4_500_000_000_000;
    const EMOJICOIN_REMAINDER: u64 = 100_000_000_000_000_000;
    const EMOJICOIN_SUPPLY: u64 = 450_000_000_000_000_000;
    const LP_TOKENS_INITIAL: u64 = 316_227_766_016_837;
    const BASE_REAL_FLOOR: u64 = 0;
    const QUOTE_REAL_FLOOR: u64 = 0;
    const BASE_REAL_CEILING: u64 = 350_000_000_000_000_000;
    const QUOTE_REAL_CEILING: u64 = 1_000_000_000_000;
    const BASE_VIRTUAL_FLOOR: u64 = 140_000_000_000_000_000;
    const QUOTE_VIRTUAL_FLOOR: u64 = 400_000_000_000;
    const BASE_VIRTUAL_CEILING: u64 = 490_000_000_000_000_000;
    const QUOTE_VIRTUAL_CEILING: u64 = 1_400_000_000_000;
    const POOL_FEE_RATE_BPS: u8 = 25;

    // Swap results in attempted divide by zero.
    const E_SWAP_DIVIDE_BY_ZERO: u64 = 0;
    // No input amount provided for swap.
    const E_SWAP_INPUT_ZERO: u64 = 1;

    struct Reserves has copy, drop, store {
        base: u64,
        quote: u64,
    }

    #[resource_group = ObjectGroup]
    struct Market has key {
        market_id: u64,
        market_address: address,
        emoji_bytes: vector<u8>,
        extend_ref: ExtendRef,
        clamm_virtual_reserves: Reserves,
        cpamm_real_reserves: Reserves,
        lp_token_supply: u64,
    }

    #[resource_group = ObjectGroup]
    struct Registry has key {
        registry_address: address,
        supported_emojis: SmartTable<vector<u8>, u8>,
        markets_by_emoji_bytes: SmartTable<vector<u8>, address>,
        markets_by_market_id: SmartTable<u64, address>,
        extend_ref: ExtendRef,
    }

    #[event]
    struct Swap has copy, drop, store {
        market_id: u64,
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        output_amount: u64,
        integrator_fee: u64,
        pool_fee: u64,
        starts_in_bonding_curve: bool,
        results_in_state_transition: bool,
    }

    struct RegistryAddress has key {
        registry_address: address,
    }

    public entry fun swap<B, Q>(
        swapper: &signer,
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        market_address: address,
    ) acquires Market {
        let market_ref_mut = borrow_global_mut<Market>(market_address);
        let market_signer = object::generate_signer_for_extending(&market_ref_mut.extend_ref);
        let swapper_address = signer::address_of(swapper);
        let event = simulate_swap_inner(
            input_amount,
            input_is_base,
            integrator,
            integrator_fee_rate_bps,
            market_ref_mut,
        );
        if (input_is_base) { // If selling, no possibility of state transition.
            coin::transfer<B>(swapper, market_address, input_amount);
            coin::transfer<Q>(&market_signer, integrator, event.integrator_fee);
            coin::transfer<Q>(&market_signer, swapper_address, event.output_amount);
            let reserves_ref_mut = if (event.starts_in_bonding_curve)
                &mut market_ref_mut.clamm_virtual_reserves else
                &mut market_ref_mut.cpamm_real_reserves;
            reserves_ref_mut.base = reserves_ref_mut.base + event.input_amount;
            reserves_ref_mut.quote =
                reserves_ref_mut.quote - event.integrator_fee - event.output_amount;
        } else { // If buying, might need to buy through the state transition.
            coin::transfer<Q>(swapper, integrator, event.integrator_fee);
            let transfer_from_swapper_to_market = input_amount - event.integrator_fee;
            coin::transfer<Q>(swapper, market_address, transfer_from_swapper_to_market);
            coin::transfer<B>(&market_signer, swapper_address, event.output_amount);
            if (event.results_in_state_transition) {
                //
                // Mint `LP_TOKENS_INITIAL` tokens to the market's `CoinStore`.
                //
                let clamm_virtual_reserves_ref_mut = &mut market_ref_mut.clamm_virtual_reserves;
                let quote_to_transition = QUOTE_REAL_CEILING - clamm_virtual_reserves_ref_mut.quote;
                let quote_into_cpamm = transfer_from_swapper_to_market - quote_to_transition;
                let base_out_of_cpamm = event.output_amount - clamm_virtual_reserves_ref_mut.base;
                clamm_virtual_reserves_ref_mut.base = 0;
                clamm_virtual_reserves_ref_mut.quote = 0;
                let cpamm_real_reserves_ref_mut = &mut market_ref_mut.cpamm_real_reserves;
                cpamm_real_reserves_ref_mut.base = EMOJICOIN_REMAINDER - base_out_of_cpamm;
                cpamm_real_reserves_ref_mut.quote = QUOTE_REAL_CEILING + quote_into_cpamm;
            } else {
                let reserves_ref_mut = if (event.starts_in_bonding_curve)
                    &mut market_ref_mut.clamm_virtual_reserves else
                    &mut market_ref_mut.cpamm_real_reserves;
                reserves_ref_mut.base = reserves_ref_mut.base - event.output_amount;
                reserves_ref_mut.quote = reserves_ref_mut.quote + transfer_from_swapper_to_market;

            };
        };
        event::emit(event);
    }

    fun init_module(emojicoin_dot_fun: &signer) {
        let constructor_ref = object::create_object(@emojicoin_dot_fun);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let registry_signer = object::generate_signer(&constructor_ref);
        let registry_address = object::address_from_constructor_ref(&constructor_ref);
        move_to(emojicoin_dot_fun, RegistryAddress { registry_address });
        let registry = Registry {
            registry_address,
            supported_emojis: smart_table::new(),
            markets_by_emoji_bytes: smart_table::new(),
            markets_by_market_id: smart_table::new(),
            extend_ref,
        };

        smart_table::add_all(
            &mut registry.supported_emojis,
            hex_codes::get_all(),
            hex_codes::get_zeroed_vector(),
        );
        move_to(&registry_signer, registry);
    }

    #[view]
    public fun is_supported_emoji(hex_bytes: vector<u8>): bool acquires Registry, RegistryAddress {
        let registry_address = borrow_global<RegistryAddress>(@emojicoin_dot_fun).registry_address;
        let registry = borrow_global<Registry>(registry_address);
        smart_table::contains(&registry.supported_emojis, hex_bytes)
    }

    #[view]
    public fun simulate_swap(
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        market_address: address,
    ): Swap
    acquires Market {
        simulate_swap_inner(
            input_amount,
            input_is_base,
            integrator,
            integrator_fee_rate_bps,
            borrow_global(market_address),
        )
    }

    inline fun simulate_swap_inner(
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        market_ref: &Market,
    ): Swap {
        assert!(input_amount > 0, E_SWAP_INPUT_ZERO);
        let starts_in_bonding_curve = market_ref.lp_token_supply == 0;
        let output_amount;
        let integrator_fee;
        let pool_fee = 0;
        let results_in_state_transition = false;
        if (input_is_base) { // If selling, no possibility of state transition.
            if (starts_in_bonding_curve) { // Selling to bonding curve.
                let quote_output_before_integrator_fee = cpamm_simple_swap_output_amount(
                    input_amount,
                    input_is_base,
                    market_ref.clamm_virtual_reserves,
                );
                integrator_fee =
                    get_bps_fee(quote_output_before_integrator_fee, integrator_fee_rate_bps);
                output_amount = quote_output_before_integrator_fee - integrator_fee;
            } else { // Selling to CPAMM.
                let quote_output_before_fees = cpamm_simple_swap_output_amount(
                    input_amount,
                    input_is_base,
                    market_ref.cpamm_real_reserves,
                );
                integrator_fee = get_bps_fee(quote_output_before_fees, integrator_fee_rate_bps);
                pool_fee = get_bps_fee(quote_output_before_fees, POOL_FEE_RATE_BPS);
                output_amount = quote_output_before_fees - integrator_fee - pool_fee;
            }
        } else { // If buying, there may be a state transition.
            integrator_fee = get_bps_fee(input_amount, integrator_fee_rate_bps);
            let quote_input_after_integrator_fee = input_amount - integrator_fee;
            if (starts_in_bonding_curve) {
                let quote_to_transition =
                    QUOTE_REAL_CEILING - market_ref.cpamm_real_reserves.quote;
                if (quote_input_after_integrator_fee < quote_to_transition) { // Staying in curve.
                    output_amount = cpamm_simple_swap_output_amount(
                        quote_input_after_integrator_fee,
                        input_is_base,
                        market_ref.clamm_virtual_reserves,
                    );
                } else { // Max quote has been deposited to bonding curve.
                    results_in_state_transition = true;
                    // Clear out remaining base.
                    output_amount = market_ref.cpamm_real_reserves.base;
                    quote_input_after_integrator_fee =
                        quote_input_after_integrator_fee - quote_to_transition;
                    if (quote_input_after_integrator_fee > 0) { // Keep buying against CPAMM.
                        // Evaluate swap against CPAMM with newly locked liquidity.
                        let base_output_from_pool_before_pool_fee = cpamm_simple_swap_output_amount(
                            quote_input_after_integrator_fee,
                            input_is_base,
                            Reserves { base: EMOJICOIN_REMAINDER, quote: QUOTE_REAL_CEILING },
                        );
                        pool_fee =
                            get_bps_fee(base_output_from_pool_before_pool_fee, POOL_FEE_RATE_BPS);
                        let base_output_from_pool_after_pool_fee =
                            base_output_from_pool_before_pool_fee - pool_fee;
                        output_amount = output_amount + base_output_from_pool_after_pool_fee;
                    }
                }
            } else { // Buying from CPAMM only.
                let output_amount_before_pool_fee = cpamm_simple_swap_output_amount(
                    quote_input_after_integrator_fee,
                    input_is_base,
                    market_ref.cpamm_real_reserves,
                );
                pool_fee = get_bps_fee(output_amount_before_pool_fee, POOL_FEE_RATE_BPS);
                output_amount = output_amount_before_pool_fee - pool_fee;
            }
        };
        Swap {
            market_id: market_ref.market_id,
            input_amount,
            input_is_base,
            integrator,
            integrator_fee_rate_bps,
            output_amount,
            integrator_fee,
            pool_fee,
            starts_in_bonding_curve,
            results_in_state_transition,
        }
    }

    inline fun get_bps_fee(
        principal: u64,
        fee_rate_bps: u8,
    ): u64 {
        ((((principal as u128) * (fee_rate_bps as u128)) / BASIS_POINTS_PER_UNIT) as u64)
    }

    inline fun cpamm_simple_swap_output_amount(
        input_amount: u64,
        input_is_base: bool,
        reserves: Reserves
    ): u64 {
        let (numerator_coefficient, denominator_addend) = if (input_is_base)
            (reserves.quote, reserves.base) else (reserves.base, reserves.quote);
        let numerator = (input_amount as u128) * (numerator_coefficient as u128);
        let denominator = (input_amount as u128) + (denominator_addend as u128);
        assert!(denominator > 0, E_SWAP_DIVIDE_BY_ZERO);
        let result = numerator / denominator;
        (result as u64)
    }

    #[test]
    fun test_cpamm_simple_swap_output_amount() {
        // Buy all base from start of bonding curve.
        let reserves = Reserves { base: BASE_VIRTUAL_CEILING, quote: QUOTE_VIRTUAL_FLOOR };
        let output = cpamm_simple_swap_output_amount(QUOTE_REAL_CEILING, false, reserves);
        assert!(output == BASE_REAL_CEILING, 0);
        // Sell all base to a bonding curve that is theoretically complete but has not transitioned.
        reserves = Reserves { base: BASE_VIRTUAL_FLOOR, quote: QUOTE_VIRTUAL_CEILING };
        output = cpamm_simple_swap_output_amount(BASE_REAL_CEILING, true, reserves);
        assert!(output == QUOTE_REAL_CEILING, 0);
    }

    #[test, expected_failure(abort_code = E_SWAP_DIVIDE_BY_ZERO)]
    fun test_cpamm_simple_swap_output_amount_divide_by_zero() {
        cpamm_simple_swap_output_amount(0, true, Reserves { base: 0, quote: 16});
    }

    #[test]
    fun test_all_supported_emojis_under_10_bytes() {
        let all_supported_emojis = hex_codes::get_all();
        vector::for_each(all_supported_emojis, |bytes| {
            assert!(vector::length(&bytes) <= (MAX_SYMBOL_LENGTH as u64), 0);
        });
    }

    #[test(deployer = @emojicoin_dot_fun)]
    fun test_supported_emoji_happy_path(deployer: &signer) acquires Registry, RegistryAddress {
        aptos_account::create_account(@emojicoin_dot_fun);
        init_module(deployer);
        let various_emojis = vector<vector<u8>> [
            x"f09f868e",         // AB button blood type, 1F18E.
            x"f09fa6bbf09f8fbe", // Ear with hearing aid medium dark skin tone, 1F9BB 1F3FE.
            x"f09f87a7f09f87b9", // Flag Bhutan, 1F1E7 1F1F9.
            x"f09f9190f09f8fbe", // Open hands medium dark skin tone, 1F450 1F3FE.
            x"f09fa4b0f09f8fbc", // Pregnant woman medium light skin tone, 1F930 1F3FC.
            x"f09f9faa",         // Purple square, 1F7EA.
            // Woman and man holding hands medium dark skin tone, 1F46B 1F3FE.
            x"f09f91abf09f8fbe",
            x"f09f91a9f09f8fbe", // Woman medium dark skin tone, 1F469 1F3FE.
            x"f09fa795f09f8fbd", // Woman with headscarf medium skin tone, 1F9D5 1F3FD.
            x"f09fa490",         // Zipper mouth face, 1F910.
        ];
        vector::for_each(various_emojis, |bytes| {
            assert!(is_supported_emoji(bytes), 0);
        });

        // Test unsupported emojis.
        assert!(!is_supported_emoji(x"0000"), 0);
        assert!(!is_supported_emoji(x"fe0f"), 0);
        assert!(!is_supported_emoji(x"1234"), 0);
        assert!(!is_supported_emoji(x"f0fabcdefabcdeff0f"), 0);
        assert!(!is_supported_emoji(x"f0beefcafef0"), 0);
        // Minimally qualified "head shaking horizontally".
        assert!(!is_supported_emoji(x"f09f9982e2808de28694"), 0);
    }

}
