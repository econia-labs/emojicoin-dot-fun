// cspell:words blackpaper
module emojicoin_dot_fun::emojicoin_dot_fun {

    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_framework::object::{Self, ExtendRef, ObjectGroup};
    use emojicoin_dot_fun::hex_codes;

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
    const POOL_FEE_RATE_BPS: u64 = 25;

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
        real_reserves: Reserves,
        virtual_reserves: Reserves,
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
        results_in_state_transition: bool,
        integrator_fees_paid: u64,
        pool_fees_paid: u64,
        bonding_curve_base_delta: u64,
        bonding_curve_quote_delta: u64,
        cpamm_base_delta: u64,
        cpamm_quote_delta: u64,
    }

    struct RegistryAddress has key {
        registry_address: address,
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

    inline fun simulate_swap(
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        market_ref: &Market,
    ): Swap {
        assert!(input_amount > 0, E_SWAP_INPUT_ZERO);
        let starts_in_bonding_curve_state = market_ref.lp_token_supply == 0;
        let integrator_fees_paid = 0;
        let input_amount_after_fees = 0;
        let output_amount = 0;
        let results_in_state_transition = false;
        let pool_fees_paid = 0;
        let bonding_curve_base_delta = 0;
        let bonding_curve_quote_delta = 0;
        let cpamm_base_delta = 0;
        let cpamm_quote_delta = 0;
        let remaining_quote_after_state_transition = 0;
        if (starts_in_bonding_curve_state) {
            if (input_is_base) { // Selling back to bonding curve.
                let output_before_fees = cpamm_simple_swap_output_amount(
                    input_amount,
                    input_is_base,
                    market_ref.virtual_reserves,
                );
                // Fees assessed on quote output proceeds.
                integrator_fees_paid = get_bps_fee(output_before_fees, integrator_fee_rate_bps);
                output_amount = output_before_fees - integrator_fees_paid;
                bonding_curve_base_delta = input_amount;
                bonding_curve_quote_delta = output_before_fees;
            } else { // Buying from bonding curve.
                // Fees assessed on quote input before it goes to the pool.
                integrator_fees_paid = get_bps_fee(input_amount, integrator_fee_rate_bps);
                input_amount_after_fees = input_amount - integrator_fees_paid;
                let max_possible_input = QUOTE_REAL_CEILING - market_ref.real_reserves.quote;
                if (input_amount_after_fees <= max_possible_input) { // Not leaving bonding curve.
                    output_amount = cpamm_simple_swap_output_amount(
                        input_amount_after_fees,
                        input_is_base,
                        market_ref.virtual_reserves,
                    );
                    bonding_curve_base_delta = output_amount;
                    bonding_curve_quote_delta = input_amount_after_fees;
                } else { // Leaving bonding curve.
                    results_in_state_transition = true;
                    remaining_quote_after_state_transition =
                        input_amount_after_fees - max_possible_input;
                    output_amount = market_ref.real_reserves.base;
                    bonding_curve_base_delta = output_amount;
                    bonding_curve_quote_delta = max_possible_input;
                }
            };
        };
        if (!starts_in_bonding_curve_state || results_in_state_transition) {
            if (input_is_base) { // Selling to pool.
                // Swap against pool.
                // Reinvest pool fees.
                // Assess integrator fees.
            } else { // Buying from pool.
                if (!results_in_state_transition) {
                    integrator_fees_paid = get_bps_fee(input_amount, integrator_fee_rate_bps);
                    input_amount_after_fees = input_amount - integrator_fees_paid;
                } else { // Swap triggered state transition, so integrator fees already assessed.
                    // Handle case of if just barely hit state transition but no more to swap
                    // Set up pool virtual reserves.
                    // Do not double asses integrator
                };
                // Swap against pool, reinvest output.
            }
        };
        Swap {
            market_id: market_ref.market_id,
            input_amount,
            input_is_base,
            integrator,
            integrator_fee_rate_bps,
            output_amount,
            results_in_state_transition,
            integrator_fees_paid,
            pool_fees_paid,
            bonding_curve_base_delta,
            bonding_curve_quote_delta,
            cpamm_base_delta,
            cpamm_quote_delta,
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
