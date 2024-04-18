module emojicoin_dot_fun::emojicoin_dot_fun {

    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::{AptosCoin};
    use aptos_framework::code;
    use aptos_framework::coin::{Self, BurnCapability, Coin, MintCapability};
    use aptos_framework::event;
    use aptos_framework::object::{Self, ExtendRef, ObjectGroup};
    use aptos_std::smart_table::{Self, SmartTable};
    use emojicoin_dot_fun::hex_codes;
    use std::bcs;
    use std::string;
    use std::vector;
    use std::option::{Self, Option};
    use std::signer;

    const MAX_SYMBOL_LENGTH: u8 = 10;
    const EXPECTED_FULL_SYMBOL_LENGTH: u8 = 11;

    const U64_MAX_AS_u128: u128 = 0xffffffffffffffff;
    const BASIS_POINTS_PER_UNIT: u128 = 10_000;

    /// Denominated in AptosCoin.
    const REGISTER_MARKET_FEE: u64 = 100_000_000;

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

    /// Swap results in attempted divide by zero.
    const E_SWAP_DIVIDE_BY_ZERO: u64 = 0;
    /// No input amount provided for swap.
    const E_SWAP_INPUT_ZERO: u64 = 1;
    /// No market exists at the given address.
    const E_NO_MARKET: u64 = 2;
    /// The market is still in the bonding curve.
    const E_STILL_IN_BONDING_CURVE: u64 = 3;
    /// No quote amount given during liquidity provision/removal.
    const E_LIQUIDITY_NO_QUOTE: u64 = 4;
    /// Providing quote amount as liquidity would require more base than existing supply.
    const E_PROVIDE_BASE_TOO_SCARCE: u64 = 5;
    /// Providing quote amount as liquidity would result in LP coin overflow.
    const E_PROVIDE_TOO_MANY_LP_COINS: u64 = 6;
    /// Remove liquidity operation specified more LP coins than existing supply.
    const E_REMOVE_TOO_MANY_LP_COINS: u64 = 7;

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
        lp_coin_supply: u128,
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
        swapper: address,
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        net_proceeds: u64,
        base_volume: u64,
        quote_volume: u64,
        integrator_fee: u64,
        pool_fee: u64,
        starts_in_bonding_curve: bool,
        results_in_state_transition: bool,
    }

    #[resource_group = ObjectGroup]
    struct LPCoinCapabilities<phantom CoinType, phantom LPCoinType> has key {
        burn: BurnCapability<LPCoinType>,
        mint: MintCapability<LPCoinType>,
    }

    #[event]
    struct Liquidity has copy, drop, store {
        market_id: u64,
        provider: address,
        base_amount: u64,
        quote_amount: u64,
        lp_coin_amount: u64,
        liquidity_provided: bool,
        pro_rata_base_donation_claim_amount: u64,
        pro_rata_quote_donation_claim_amount: u64,
    }

    struct RegistryAddress has key {
        registry_address: address,
    }

    public entry fun register_market(
        sender: &signer,
        emojis: vector<vector<u8>>
    ) acquires Registry, RegistryAddress {
        let (can_register, emoji_bytes) = can_market_be_registered(sender, emojis);
        if (!can_register) {
            return
        };

        // NOTE: Do not silently return after here; the rest of this function has side effects.

        // Create the named Market object.
        let registry = borrow_global<Registry>(get_registry_address());
        let registry_signer = object::generate_signer_for_extending(&registry.extend_ref);
        let market_constructor_ref = object::create_named_object(&registry_signer, emoji_bytes);
        let market_extend_ref = object::generate_extend_ref(&market_constructor_ref);
        let market_signer = object::generate_signer_for_extending(&market_extend_ref);
        let market_address = object::address_from_constructor_ref(&market_constructor_ref);

        create_market_and_add_to_registry(
            &market_signer,
            market_address,
            emoji_bytes,
            market_extend_ref,
        );

        // Interpolate the Market object address and emoji symbol bytes into the
        // coin_factory.move bytecode, then use that bytecode to publish the module
        // with the market object's signer.
        let (metadata_bytecode, module_bytecode) = hex_codes::get_publish_code(
            market_address,
            // These emoji bytes are just the symbol. coin_factory.move handles creating
            // the `name` by appending b" emojicoin" to the symbol.
            emoji_bytes,
        );

        code::publish_package_txn(
            &market_signer,
            metadata_bytecode,
            module_bytecode,
        );

    }

    // Intended to be called from `coin_factory`, this function facilitates
    // storing the LP Coin capabilities atomically when the coin factory
    // module is initialized.
    public fun store_lp_coin_capabilities<CoinType, LPCoinType>(
        market_obj: &signer,
        burn_cap: BurnCapability<LPCoinType>,
        mint_cap: MintCapability<LPCoinType>,
    ) {
        assert!(exists<Market>(signer::address_of(market_obj)), E_NO_MARKET);
        move_to(market_obj, LPCoinCapabilities<CoinType, LPCoinType> {
            burn: burn_cap,
            mint: mint_cap,
        });
    }

    inline fun get_market_ref_mut_and_signer_checked(market_address: address): (
        &mut Market,
        signer,
    ) acquires Market {
        assert!(exists<Market>(market_address), E_NO_MARKET);
        let market_ref_mut = borrow_global_mut<Market>(market_address);
        let market_signer = object::generate_signer_for_extending(&market_ref_mut.extend_ref);
        (market_ref_mut, market_signer)
    }

    public entry fun swap<B, Q, LP>(
        market_address: address,
        swapper: &signer,
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
    ) acquires LPCoinCapabilities, Market {
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        let swapper_address = signer::address_of(swapper);
        let event = simulate_swap_inner(
            swapper_address,
            input_amount,
            input_is_base,
            integrator,
            integrator_fee_rate_bps,
            market_ref_mut,
        );
        let quote;
        if (input_is_base) { // If selling, no possibility of state transition.
            coin::transfer<B>(swapper, market_address, input_amount);
            let quote_leaving_market = event.quote_volume + event.integrator_fee;
            quote = coin::withdraw<Q>(&market_signer, quote_leaving_market);
            let net_proceeds = coin::extract(&mut quote, event.quote_volume);
            aptos_account::deposit_coins(swapper_address, net_proceeds);
            let reserves_ref_mut = if (event.starts_in_bonding_curve)
                &mut market_ref_mut.clamm_virtual_reserves else
                &mut market_ref_mut.cpamm_real_reserves;
            reserves_ref_mut.base = reserves_ref_mut.base + event.input_amount;
            reserves_ref_mut.quote = reserves_ref_mut.quote - quote_leaving_market;
        } else { // If buying, might need to buy through the state transition.
            quote = coin::withdraw<Q>(swapper, input_amount);
            coin::deposit(market_address, coin::extract(&mut quote, event.quote_volume));
            aptos_account::transfer_coins<B>(&market_signer, swapper_address, event.base_volume);
            if (event.results_in_state_transition) { // Buy with state transition.
                let lp_coins = mint_lp_coins<B, LP>(market_address, LP_TOKENS_INITIAL);
                coin::deposit<LP>(market_address, lp_coins);
                let clamm_virtual_reserves_ref_mut = &mut market_ref_mut.clamm_virtual_reserves;
                let quote_to_transition =
                    QUOTE_VIRTUAL_CEILING - clamm_virtual_reserves_ref_mut.quote;
                let base_left_in_clamm = clamm_virtual_reserves_ref_mut.base - BASE_VIRTUAL_FLOOR;
                let quote_into_cpamm = event.quote_volume - quote_to_transition;
                let base_out_of_cpamm = event.base_volume - base_left_in_clamm;
                clamm_virtual_reserves_ref_mut.base = 0;
                clamm_virtual_reserves_ref_mut.quote = 0;
                let cpamm_real_reserves_ref_mut = &mut market_ref_mut.cpamm_real_reserves;
                cpamm_real_reserves_ref_mut.base = EMOJICOIN_REMAINDER - base_out_of_cpamm;
                cpamm_real_reserves_ref_mut.quote = QUOTE_REAL_CEILING + quote_into_cpamm;
            } else { // Buy without state transition.
                let reserves_ref_mut = if (event.starts_in_bonding_curve)
                    &mut market_ref_mut.clamm_virtual_reserves else
                    &mut market_ref_mut.cpamm_real_reserves;
                reserves_ref_mut.base = reserves_ref_mut.base - event.base_volume;
                reserves_ref_mut.quote = reserves_ref_mut.quote + event.quote_volume;

            };
        };
        aptos_account::deposit_coins(integrator, quote);
        event::emit(event);
    }

    public entry fun provide_liquidity<B, Q, LP>(
        market_address: address,
        provider: &signer,
        quote_amount: u64,
    ) acquires LPCoinCapabilities, Market {
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        let provider_address = signer::address_of(provider);
        let event = simulate_provide_liquidity_inner(
            provider_address,
            quote_amount,
            market_ref_mut
        );

        // Transfer coins.
        coin::transfer<B>(provider, market_address, event.base_amount);
        coin::transfer<Q>(provider, market_address, event.quote_amount);
        let lp_coins = mint_lp_coins<B, LP>(market_ref_mut.market_address, event.lp_coin_amount);
        aptos_account::deposit_coins(provider_address, lp_coins);

        // Update state.
        let reserves_ref_mut = &mut market_ref_mut.cpamm_real_reserves;
        reserves_ref_mut.base = reserves_ref_mut.base + event.base_amount;
        reserves_ref_mut.quote = reserves_ref_mut.quote + event.quote_amount;
        market_ref_mut.lp_coin_supply =
            market_ref_mut.lp_coin_supply + (event.lp_coin_amount as u128);
        event::emit(event);
    }

    public entry fun remove_liquidity<B, Q, LP>(
        market_address: address,
        provider: &signer,
        lp_coin_amount: u64,
    ) acquires LPCoinCapabilities, Market {
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        let provider_address = signer::address_of(provider);
        let event = simulate_remove_liquidity_inner<B, Q>(
            provider_address,
            lp_coin_amount,
            market_ref_mut
        );

        // Transfer coins.
        let base_total = event.base_amount + event.pro_rata_base_donation_claim_amount;
        let quote_total = event.quote_amount + event.pro_rata_quote_donation_claim_amount;
        coin::transfer<B>(&market_signer, provider_address, base_total);
        coin::transfer<Q>(&market_signer, provider_address, quote_total);

        // Burn coins by first withdrawing them from provider's coin store, to trigger event.
        let lp_coins = coin::withdraw<LP>(provider, event.lp_coin_amount);
        burn_lp_coin<B, LP>(market_ref_mut.market_address, lp_coins);

        // Update state.
        let reserves_ref_mut = &mut market_ref_mut.cpamm_real_reserves;
        reserves_ref_mut.base = reserves_ref_mut.base - event.base_amount;
        reserves_ref_mut.quote = reserves_ref_mut.quote - event.quote_amount;
        market_ref_mut.lp_coin_supply =
            market_ref_mut.lp_coin_supply - (event.lp_coin_amount as u128);
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
    /// Checks if an individual emoji is supported. Note that this does *not*
    /// check if multiple concatenated emojis are valid.
    public fun is_a_supported_emoji(hex_bytes: vector<u8>): bool acquires Registry, RegistryAddress {
        let registry_address = borrow_global<RegistryAddress>(@emojicoin_dot_fun).registry_address;
        let registry = borrow_global<Registry>(registry_address);
        smart_table::contains(&registry.supported_emojis, hex_bytes)
    }

    #[view]
    public fun simulate_swap(
        market_address: address,
        swapper: address,
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
    ): Swap
    acquires Market {
        assert!(exists<Market>(market_address), E_NO_MARKET);
        simulate_swap_inner(
            swapper,
            input_amount,
            input_is_base,
            integrator,
            integrator_fee_rate_bps,
            borrow_global(market_address),
        )
    }

    #[view]
    public fun simulate_provide_liquidity(
        market_address: address,
        provider: address,
        quote_amount: u64,
    ): Liquidity
    acquires Market {
        assert!(exists<Market>(market_address), E_NO_MARKET);
        simulate_provide_liquidity_inner(
            provider,
            quote_amount,
            borrow_global(market_address),
        )
    }

    #[view]
    public fun simulate_remove_liquidity<B, Q>(
        market_address: address,
        provider: address,
        lp_coin_amount: u64,
    ): Liquidity
    acquires Market {
        assert!(exists<Market>(market_address), E_NO_MARKET);
        simulate_remove_liquidity_inner<B, Q>(
            provider,
            lp_coin_amount,
            borrow_global(market_address),
        )
    }

    inline fun get_registry_address(): address {
        borrow_global<RegistryAddress>(@emojicoin_dot_fun).registry_address
    }

    inline fun get_market_address(emoji_bytes: vector<u8>): Option<address> {
        let registry = borrow_global<Registry>(get_registry_address());
        let markets = &registry.markets_by_emoji_bytes;
        if (smart_table::contains(markets, emoji_bytes)) {
            option::some(*smart_table::borrow(markets, emoji_bytes))
        } else {
            option::none()
        }
    }

    inline fun create_market_and_add_to_registry(
        obj_signer: &signer,
        market_address: address,
        emoji_bytes: vector<u8>,
        extend_ref: ExtendRef,
    ) {
        let registry = borrow_global_mut<Registry>(get_registry_address());
        let market_id = 1 + smart_table::length(&registry.markets_by_emoji_bytes);
        smart_table::add(&mut registry.markets_by_emoji_bytes, emoji_bytes, market_address);
        smart_table::add(&mut registry.markets_by_market_id, market_id, market_address);

        move_to(obj_signer, Market {
            market_id,
            market_address,
            emoji_bytes,
            extend_ref,
            clamm_virtual_reserves: Reserves {
                base: BASE_VIRTUAL_FLOOR,
                quote: QUOTE_VIRTUAL_FLOOR,
            },
            cpamm_real_reserves: Reserves {
                base: BASE_REAL_FLOOR,
                quote: QUOTE_REAL_FLOOR,
            },
            lp_coin_supply: 0,
        });
    }

    inline fun burn_lp_coin_from<CoinType, LPCoinType>(
        market_address: address,
        account_addr: address,
        amount: u64,
    ) acquires LPCoinCapabilities {
        let coin_caps = borrow_global<LPCoinCapabilities<CoinType, LPCoinType>>(market_address);
        coin::burn_from<LPCoinType>(account_addr, amount, &coin_caps.burn);
    }

    inline fun burn_lp_coin<CoinType, LPCoinType>(
        market_address: address,
        coin: Coin<LPCoinType>,
    ) acquires LPCoinCapabilities {
        let coin_caps = borrow_global<LPCoinCapabilities<CoinType, LPCoinType>>(market_address);
        coin::burn<LPCoinType>(coin, &coin_caps.burn);
    }

    inline fun mint_lp_coins<CoinType, LPCoinType>(
        market_address: address,
        amount: u64,
    ): Coin<LPCoinType> acquires LPCoinCapabilities {
        let coin_caps = borrow_global<LPCoinCapabilities<CoinType, LPCoinType>>(market_address);
        coin::mint<LPCoinType>(amount, &coin_caps.mint)
    }

    inline fun can_market_be_registered(
        sender: &signer,
        emojis: vector<vector<u8>>,
    ): (bool, vector<u8>) acquires Registry, RegistryAddress {
        let num_emojis = vector::length(&emojis);
        if (num_emojis == 0) {
           (false, b"")
        } else {
            let sender_addr = signer::address_of(sender);
            let insufficient_balance = coin::balance<AptosCoin>(sender_addr) < REGISTER_MARKET_FEE;
            if (insufficient_balance) {
                (false, b"")
            } else {
                let (is_well_formed, symbol_bytes) = ensure_multiple_emojis_well_formed(emojis);

                if (!is_well_formed) {
                    (false, b"")
                } else {
                    let opt_market_address = get_market_address(symbol_bytes);
                    let is_registered_market = option::is_some(&opt_market_address);

                    let utf8_bytes = bcs::to_bytes(&symbol_bytes);
                    let utf8_string = string::utf8(utf8_bytes);
                    let symbol_length = string::length(&utf8_string);
                    let symbol_too_long = symbol_length > (MAX_SYMBOL_LENGTH as u64);

                    if (symbol_too_long || is_registered_market) {
                        (false, b"")
                    } else {
                        (true, symbol_bytes)
                    }
                }
            }
        }
    }

    inline fun simulate_swap_inner(
        swapper: address,
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        market_ref: &Market,
    ): Swap {
        assert!(input_amount > 0, E_SWAP_INPUT_ZERO);
        let starts_in_bonding_curve = market_ref.lp_coin_supply == 0;
        let net_proceeds;
        let base_volume;
        let quote_volume;
        let integrator_fee;
        let pool_fee = 0;
        let results_in_state_transition = false;
        if (input_is_base) { // If selling, no possibility of state transition.
            let amm_quote_output;
            if (starts_in_bonding_curve) { // Selling to CLAMM only.
                amm_quote_output = cpamm_simple_swap_output_amount(
                    input_amount,
                    input_is_base,
                    market_ref.clamm_virtual_reserves,
                );
            } else { // Selling to CPAMM only.
                amm_quote_output = cpamm_simple_swap_output_amount(
                    input_amount,
                    input_is_base,
                    market_ref.cpamm_real_reserves,
                );
                pool_fee = get_bps_fee(amm_quote_output, POOL_FEE_RATE_BPS);
            };
            integrator_fee = get_bps_fee(amm_quote_output, integrator_fee_rate_bps);
            base_volume = input_amount;
            quote_volume = amm_quote_output - pool_fee - integrator_fee;
            net_proceeds = quote_volume;
        } else { // If buying, there may be a state transition.
            integrator_fee = get_bps_fee(input_amount, integrator_fee_rate_bps);
            quote_volume = input_amount - integrator_fee;
            if (starts_in_bonding_curve) {
                let max_quote_volume_in_clamm =
                    QUOTE_VIRTUAL_CEILING - market_ref.clamm_virtual_reserves.quote;
                if (quote_volume < max_quote_volume_in_clamm) {
                    base_volume = cpamm_simple_swap_output_amount(
                        quote_volume,
                        input_is_base,
                        market_ref.clamm_virtual_reserves,
                    );
                } else { // Max quote has been deposited to bonding curve.
                    results_in_state_transition = true;
                    // Clear out remaining base.
                    base_volume = market_ref.clamm_virtual_reserves.base - BASE_VIRTUAL_FLOOR;
                    let remaining_quote_volume = quote_volume - max_quote_volume_in_clamm;
                    if (remaining_quote_volume > 0) { // Keep buying against CPAMM.
                        // Evaluate swap against CPAMM with newly locked liquidity.
                        let cpamm_base_output = cpamm_simple_swap_output_amount(
                            remaining_quote_volume,
                            input_is_base,
                            Reserves { base: EMOJICOIN_REMAINDER, quote: QUOTE_REAL_CEILING },
                        );
                        pool_fee = get_bps_fee(cpamm_base_output, POOL_FEE_RATE_BPS);
                        base_volume = base_volume + cpamm_base_output - pool_fee;
                    };
                };
            } else { // Buying from CPAMM only.
                let cpamm_base_output = cpamm_simple_swap_output_amount(
                    quote_volume,
                    input_is_base,
                    market_ref.cpamm_real_reserves,
                );
                pool_fee = get_bps_fee(cpamm_base_output, POOL_FEE_RATE_BPS);
                base_volume = cpamm_base_output - pool_fee;
            };
            net_proceeds = base_volume;
        };
        Swap {
            market_id: market_ref.market_id,
            swapper,
            input_amount,
            input_is_base,
            integrator,
            integrator_fee_rate_bps,
            net_proceeds,
            base_volume,
            quote_volume,
            integrator_fee,
            pool_fee,
            starts_in_bonding_curve,
            results_in_state_transition,
        }
    }

    inline fun simulate_provide_liquidity_inner(
        provider: address,
        quote_amount: u64,
        market_ref: &Market,
    ): Liquidity {
        assert!(market_ref.lp_coin_supply > 0, E_STILL_IN_BONDING_CURVE);
        assert!(quote_amount > 0, E_LIQUIDITY_NO_QUOTE);
        let reserves_ref = market_ref.cpamm_real_reserves;
        let base_reserves_u128 = (reserves_ref.base as u128);
        let quote_reserves_u128 = (reserves_ref.quote as u128);
        let quote_amount_u128 = (quote_amount as u128);

        // Proportional base amount: (base_reserves / quote_reserves) * (quote_amount).
        let base_amount_u128 = (base_reserves_u128 * quote_amount_u128) / quote_reserves_u128;
        assert!(base_amount_u128 <= (EMOJICOIN_SUPPLY as u128), E_PROVIDE_BASE_TOO_SCARCE);

        // Proportional LP coins to mint: (quote_amount / quote_reserves) * (lp_coin_supply).
        let lp_coin_amount_u128 =
            (quote_amount_u128 * market_ref.lp_coin_supply) / quote_reserves_u128;
        assert!(lp_coin_amount_u128 <= U64_MAX_AS_u128, E_PROVIDE_TOO_MANY_LP_COINS);

        Liquidity {
            market_id: market_ref.market_id,
            provider,
            base_amount: (base_amount_u128 as u64),
            quote_amount,
            lp_coin_amount: (lp_coin_amount_u128 as u64),
            liquidity_provided: true,
            pro_rata_base_donation_claim_amount: 0,
            pro_rata_quote_donation_claim_amount: 0,
        }
    }

    inline fun simulate_remove_liquidity_inner<B, Q>(
        provider: address,
        lp_coin_amount: u64,
        market_ref: &Market,
    ): Liquidity {
        let lp_coin_supply = market_ref.lp_coin_supply;
        let lp_coin_amount_u128 = (lp_coin_amount as u128);

        assert!(lp_coin_supply > 0, E_STILL_IN_BONDING_CURVE);
        assert!(lp_coin_amount_u128 <= lp_coin_supply, E_REMOVE_TOO_MANY_LP_COINS);

        let reserves_ref = market_ref.cpamm_real_reserves;
        let base_reserves_u128 = (reserves_ref.base as u128);
        let quote_reserves_u128 = (reserves_ref.quote as u128);

        // Proportional base amount: (lp_coin_amount / lp_coin_supply) * (base_reserves).
        let base_amount = ((lp_coin_amount_u128 * base_reserves_u128 / lp_coin_supply) as u64);

        // Proportional quote amount: (lp_coin_amount / lp_coin_supply) * (quote_reserves).
        let quote_amount = ((lp_coin_amount_u128 * quote_reserves_u128 / lp_coin_supply) as u64);

        // Check to see if base or quote donations have been sent to market coin stores.
        let market_address = market_ref.market_address;
        let market_balance_base_u128 = (coin::balance<B>(market_address) as u128);
        let market_balance_quote_u128 = (coin::balance<Q>(market_address) as u128);
        let base_donations_u128 = market_balance_base_u128 - base_reserves_u128;
        let quote_donations_u128= market_balance_quote_u128 - quote_reserves_u128;
        let pro_rata_base_donation_claim_amount =
            (((lp_coin_amount_u128 * base_donations_u128) / lp_coin_supply) as u64);
        let pro_rata_quote_donation_claim_amount =
            (((lp_coin_amount_u128 * quote_donations_u128) / lp_coin_supply) as u64);

        Liquidity {
            market_id: market_ref.market_id,
            provider,
            base_amount,
            quote_amount,
            lp_coin_amount,
            liquidity_provided: false,
            pro_rata_base_donation_claim_amount,
            pro_rata_quote_donation_claim_amount,
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

    inline fun ensure_multiple_emojis_well_formed(emojis: vector<vector<u8>>): (bool, vector<u8>) {
        let well_formed = true;
        let emoji_bytes = vector<u8> [];

        for (i in 0..vector::length(&emojis)) {
            let emoji = *vector::borrow(&emojis, i);
            vector::append(&mut emoji_bytes, emoji);
            if (!is_a_supported_emoji(emoji)) {
                well_formed = false;
                break
            };
        };

        if (!well_formed) {
            (false, b"")
        } else {
            (true, emoji_bytes)
        }
    }

    #[test_only]
    public fun get_EMOJICOIN_SUPPLY(): u64 {
        EMOJICOIN_SUPPLY
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
            let emoji_as_string = string::utf8(bytes);
            assert!(string::length(&emoji_as_string) <= (MAX_SYMBOL_LENGTH as u64), 0);
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
            assert!(is_a_supported_emoji(bytes), 0);
        });

        // Test unsupported emojis.
        assert!(!is_a_supported_emoji(x"0000"), 0);
        assert!(!is_a_supported_emoji(x"fe0f"), 0);
        assert!(!is_a_supported_emoji(x"1234"), 0);
        assert!(!is_a_supported_emoji(x"f0fabcdefabcdeff0f"), 0);
        assert!(!is_a_supported_emoji(x"f0beefcafef0"), 0);
        // Minimally qualified "head shaking horizontally".
        assert!(!is_a_supported_emoji(x"f09f9982e2808de28694"), 0);
    }

    #[test]
    fun test_expected_full_symbol_length() {
        assert!(EXPECTED_FULL_SYMBOL_LENGTH == hex_codes::get_EXPECTED_FULL_SYMBOL_LENGTH(), 0);
    }
}
