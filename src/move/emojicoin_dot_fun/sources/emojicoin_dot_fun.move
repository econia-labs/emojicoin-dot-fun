module emojicoin_dot_fun::emojicoin_dot_fun {

    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::code;
    use aptos_framework::coin::{Self, BurnCapability, Coin, MintCapability};
    use aptos_framework::event;
    use aptos_framework::object::{Self, ExtendRef, ObjectGroup};
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_std::table::{Self, Table};
    use aptos_std::type_info;
    use emojicoin_dot_fun::hex_codes;
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    #[test_only] use aptos_std::aptos_coin;
    #[test_only] use emojicoin_dot_fun::bad_coin_factory::{Emojicoin as BadModuleEmojicoin};
    #[test_only] use emojicoin_dot_fun::bad_coin_factory::{EmojicoinLP as BadModuleEmojicoinLP};
    #[test_only] use emojicoin_dot_fun::coin_factory::{Emojicoin as TestEmojicoin};
    #[test_only] use emojicoin_dot_fun::coin_factory::{EmojicoinLP as TestEmojicoinLP};
    #[test_only] use emojicoin_dot_fun::coin_factory::BadType;

    const MAX_SYMBOL_LENGTH: u8 = 10;
    const DECIMALS: u8 = 8;
    const MONITOR_SUPPLY: bool = true;
    const COIN_FACTORY_AS_BYTES: vector<u8> = b"coin_factory";
    const EMOJICOIN_STRUCT_NAME: vector<u8> = b"Emojicoin";
    const EMOJICOIN_LP_STRUCT_NAME: vector<u8> = b"EmojicoinLP";
    const EMOJICOIN_NAME_SUFFIX: vector<u8> = b" emojicoin";
    const EMOJICOIN_LP_NAME_SUFFIX: vector<u8> = b" emojicoin LP";

    const U64_MAX_AS_u128: u128 = 0xffffffffffffffff;
    const BASIS_POINTS_PER_UNIT: u128 = 10_000;

    /// Denominated in `AptosCoin`.
    const MARKET_REGISTRATION_FEE: u64 = 100_000_000;

    // Generated automatically by blackpaper calculations script.
    const MARKET_CAP: u64 = 4_500_000_000_000;
    const EMOJICOIN_REMAINDER: u64 = 10_000_000_000_000_000;
    const EMOJICOIN_SUPPLY: u64 = 45_000_000_000_000_000;
    const LP_TOKENS_INITIAL: u64 = 100_000_000_000_000;
    const BASE_REAL_FLOOR: u64 = 0;
    const QUOTE_REAL_FLOOR: u64 = 0;
    const BASE_REAL_CEILING: u64 = 35_000_000_000_000_000;
    const QUOTE_REAL_CEILING: u64 = 1_000_000_000_000;
    const BASE_VIRTUAL_FLOOR: u64 = 14_000_000_000_000_000;
    const QUOTE_VIRTUAL_FLOOR: u64 = 400_000_000_000;
    const BASE_VIRTUAL_CEILING: u64 = 49_000_000_000_000_000;
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
    /// The type arguments passed in are invalid.
    const E_INVALID_COIN_TYPES: u64 = 8;
    /// Provided bytes do not indicate a supported emoji.
    const E_NOT_SUPPORTED_EMOJI: u64 = 9;
    /// Too many bytes in emoji symbol.
    const E_EMOJI_BYTES_TOO_LONG: u64 = 10;
    /// Market is already registered.
    const E_ALREADY_REGISTERED: u64 = 11;
    /// Account is unable to pay market registration fee.
    const E_UNABLE_TO_PAY_MARKET_REGISTRATION_FEE: u64 = 12;

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
        supported_emojis: Table<vector<u8>, u8>,
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
    struct LPCoinCapabilities<phantom CoinType, phantom LP_CoinType> has key {
        burn: BurnCapability<LP_CoinType>,
        mint: MintCapability<LP_CoinType>,
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
        registrant: &signer,
        emojis: vector<vector<u8>>,
        integrator: address,
    ) acquires Registry, RegistryAddress {
        let registry_ref_mut = borrow_registry_ref_mut();
        // Verify well-formed emoji bytes.
        let emoji_bytes = get_verified_emoji_bytes(registry_ref_mut, emojis);

        // Verify market is not already registered.
        let markets_by_emoji_bytes_ref = &registry_ref_mut.markets_by_emoji_bytes;
        let already_registered = smart_table::contains(markets_by_emoji_bytes_ref, emoji_bytes);
        assert!(!already_registered, E_ALREADY_REGISTERED);

        // Create the Market object and add it to the registry.
        let (market_address, market_signer) = create_market(registry_ref_mut, emoji_bytes);

        // Publish coin types at market address.
        let (metadata_bytecode, module_bytecode) = hex_codes::get_publish_code(market_address);
        code::publish_package_txn(&market_signer, metadata_bytecode, vector[module_bytecode]);

        // Charge registrant.
        let registrant_address = signer::address_of(registrant);
        let can_pay_fee =
            coin::is_account_registered<AptosCoin>(registrant_address) &&
            coin::balance<AptosCoin>(registrant_address) >= MARKET_REGISTRATION_FEE;
        assert!(can_pay_fee, E_UNABLE_TO_PAY_MARKET_REGISTRATION_FEE);
        aptos_account::transfer(registrant, integrator, MARKET_REGISTRATION_FEE);
    }

    inline fun create_market(
        registry_ref_mut: &mut Registry,
        emoji_bytes: vector<u8>,
    ): (address, signer) {
        // Create market object.
        let registry_signer = object::generate_signer_for_extending(&registry_ref_mut.extend_ref);
        let markets_by_emoji_bytes_ref_mut = &mut registry_ref_mut.markets_by_emoji_bytes;
        let market_constructor_ref = object::create_named_object(&registry_signer, emoji_bytes);
        let market_address = object::address_from_constructor_ref(&market_constructor_ref);
        let market_signer = object::generate_signer(&market_constructor_ref);
        let market_extend_ref = object::generate_extend_ref(&market_constructor_ref);

        let market_id = 1 + smart_table::length(markets_by_emoji_bytes_ref_mut);
        move_to(&market_signer, Market {
            market_id,
            market_address,
            emoji_bytes,
            extend_ref: market_extend_ref,
            clamm_virtual_reserves:
                Reserves { base: BASE_VIRTUAL_CEILING, quote: QUOTE_VIRTUAL_FLOOR },
            cpamm_real_reserves: Reserves { base: 0, quote: 0 },
            lp_coin_supply: 0,
        });
        // Update registry.
        smart_table::add(markets_by_emoji_bytes_ref_mut, emoji_bytes, market_address);
        smart_table::add(&mut registry_ref_mut.markets_by_market_id, market_id, market_address);

        (market_address, market_signer)
    }

    inline fun valid_coin_types<Emojicoin, EmojicoinLP>(market_address: address): bool {
        let emoji_type = &type_info::type_of<Emojicoin>();
        let lp_type = &type_info::type_of<EmojicoinLP>();

        type_info::account_address(emoji_type) == market_address    &&
        type_info::account_address(lp_type) == market_address       &&
        type_info::module_name(emoji_type) == COIN_FACTORY_AS_BYTES &&
        type_info::module_name(lp_type) == COIN_FACTORY_AS_BYTES    &&
        type_info::struct_name(emoji_type) == EMOJICOIN_STRUCT_NAME &&
        type_info::struct_name(lp_type) == EMOJICOIN_LP_STRUCT_NAME
    }

    inline fun get_verified_emoji_bytes(
        registry_ref: &Registry,
        emojis: vector<vector<u8>>,
    ): vector<u8> {
        let supported_emojis_ref: &Table<vector<u8>, u8> = &registry_ref.supported_emojis;
        let verified_bytes = vector[];
        for (i in 0..vector::length(&emojis)) {
            let emoji = *vector::borrow(&emojis, i);
            assert!(table::contains(supported_emojis_ref, emoji), E_NOT_SUPPORTED_EMOJI);
            vector::append(&mut verified_bytes, emoji);
        };
        assert!(
            vector::length(&verified_bytes) <= (MAX_SYMBOL_LENGTH as u64),
            E_EMOJI_BYTES_TOO_LONG
        );

        verified_bytes
    }

    inline fun assert_valid_coin_types<Emojicoin, EmojicoinLP>(market_address: address) {
        assert!(
            exists<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address),
            E_INVALID_COIN_TYPES
        );
    }

    inline fun ensure_coins_initialized<Emojicoin, EmojicoinLP>(
        market_ref: &Market,
        market_signer: &signer,
        market_address: address,
    ) {
        if (!exists<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address)) {
            assert!(valid_coin_types<Emojicoin, EmojicoinLP>(market_address), E_INVALID_COIN_TYPES);
            let symbol = string::utf8(market_ref.emoji_bytes);

            // Initialize emojicoin with fixed supply, throw away capabilities.
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<Emojicoin>(
                market_signer,
                get_coin_name(symbol, EMOJICOIN_NAME_SUFFIX),
                symbol,
                DECIMALS,
                MONITOR_SUPPLY
            );
            let emojicoins = coin::mint<Emojicoin>(EMOJICOIN_SUPPLY, &mint_cap);
            aptos_account::deposit_coins(market_address, emojicoins);
            coin::destroy_freeze_cap(freeze_cap);
            coin::destroy_mint_cap(mint_cap);
            coin::destroy_burn_cap(burn_cap);

            // Initialize LP coin, storing only burn and mint capabilities.
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<EmojicoinLP>(
                market_signer,
                get_coin_name(symbol, EMOJICOIN_LP_NAME_SUFFIX),
                symbol,
                DECIMALS,
                MONITOR_SUPPLY
            );
            coin::register<EmojicoinLP>(market_signer);
            coin::destroy_freeze_cap(freeze_cap);
            move_to(market_signer, LPCoinCapabilities<Emojicoin, EmojicoinLP> {
                burn: burn_cap,
                mint: mint_cap,
            });
        };

    }

    inline fun get_coin_name(symbol: String, suffix_bytes: vector<u8>): String {
        string::append_utf8(&mut symbol, suffix_bytes);
        symbol
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

    public entry fun swap<Emojicoin, EmojicoinLP>(
        market_address: address,
        swapper: &signer,
        input_amount: u64,
        input_is_base: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
    ) acquires LPCoinCapabilities, Market {
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        ensure_coins_initialized<Emojicoin, EmojicoinLP>(
            market_ref_mut,
            &market_signer,
            market_address
        );
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
        aptos_account::create_account(swapper_address); // For better feedback if no account yet.
        if (input_is_base) { // If selling, no possibility of state transition.
            coin::register<Emojicoin>(swapper); // For better feedback if insufficient funds.
            coin::transfer<Emojicoin>(swapper, market_address, input_amount);
            let quote_leaving_market = event.quote_volume + event.integrator_fee;
            quote = coin::withdraw<AptosCoin>(&market_signer, quote_leaving_market);
            let net_proceeds = coin::extract(&mut quote, event.quote_volume);
            aptos_account::deposit_coins(swapper_address, net_proceeds);
            let reserves_ref_mut = if (event.starts_in_bonding_curve)
                &mut market_ref_mut.clamm_virtual_reserves else
                &mut market_ref_mut.cpamm_real_reserves;
            reserves_ref_mut.base = reserves_ref_mut.base + event.input_amount;
            reserves_ref_mut.quote = reserves_ref_mut.quote - quote_leaving_market;
        } else { // If buying, might need to buy through the state transition.
            quote = coin::withdraw<AptosCoin>(swapper, input_amount);
            coin::deposit(market_address, coin::extract(&mut quote, event.quote_volume));
            aptos_account::transfer_coins<Emojicoin>(
                &market_signer,
                swapper_address,
                event.base_volume
            );
            if (event.results_in_state_transition) { // Buy with state transition.
                let lp_coins =
                    mint_lp_coins<Emojicoin, EmojicoinLP>(market_address, LP_TOKENS_INITIAL);
                coin::deposit<EmojicoinLP>(market_address, lp_coins);
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

    public entry fun provide_liquidity<Emojicoin, EmojicoinLP>(
        market_address: address,
        provider: &signer,
        quote_amount: u64,
    ) acquires LPCoinCapabilities, Market {
        let (market_ref_mut, _) = get_market_ref_mut_and_signer_checked(market_address);
        assert_valid_coin_types<Emojicoin, EmojicoinLP>(market_address);
        let provider_address = signer::address_of(provider);
        let event = simulate_provide_liquidity_inner(
            provider_address,
            quote_amount,
            market_ref_mut
        );

        // Transfer coins.
        coin::transfer<Emojicoin>(provider, market_address, event.base_amount);
        coin::transfer<AptosCoin>(provider, market_address, event.quote_amount);
        let lp_coins = mint_lp_coins<Emojicoin, EmojicoinLP>(
            market_ref_mut.market_address,
            event.lp_coin_amount
        );
        aptos_account::deposit_coins(provider_address, lp_coins);

        // Update state.
        let reserves_ref_mut = &mut market_ref_mut.cpamm_real_reserves;
        reserves_ref_mut.base = reserves_ref_mut.base + event.base_amount;
        reserves_ref_mut.quote = reserves_ref_mut.quote + event.quote_amount;
        market_ref_mut.lp_coin_supply =
            market_ref_mut.lp_coin_supply + (event.lp_coin_amount as u128);
        event::emit(event);
    }

    public entry fun remove_liquidity<Emojicoin, EmojicoinLP>(
        market_address: address,
        provider: &signer,
        lp_coin_amount: u64,
    ) acquires LPCoinCapabilities, Market {
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        assert_valid_coin_types<Emojicoin, EmojicoinLP>(market_address);
        let provider_address = signer::address_of(provider);
        let event = simulate_remove_liquidity_inner<Emojicoin>(
            provider_address,
            lp_coin_amount,
            market_ref_mut
        );

        // Transfer coins.
        let base_total = event.base_amount + event.pro_rata_base_donation_claim_amount;
        let quote_total = event.quote_amount + event.pro_rata_quote_donation_claim_amount;
        coin::transfer<Emojicoin>(&market_signer, provider_address, base_total);
        coin::transfer<AptosCoin>(&market_signer, provider_address, quote_total);

        // Burn coins by first withdrawing them from provider's coin store, to trigger event.
        let lp_coins = coin::withdraw<EmojicoinLP>(provider, event.lp_coin_amount);
        burn_lp_coin<Emojicoin, EmojicoinLP>(market_ref_mut.market_address, lp_coins);

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
            supported_emojis: table::new(),
            markets_by_emoji_bytes: smart_table::new(),
            markets_by_market_id: smart_table::new(),
            extend_ref,
        };

        // Load supported emojis into registry.
        vector::for_each_ref(&hex_codes::get_supported_emojis(), |emoji_bytes_ref| {
            table::add(&mut registry.supported_emojis, *emoji_bytes_ref, 0);
        });
        move_to(&registry_signer, registry);
    }

    #[view]
    /// Checks if an individual emoji is supported.
    public fun is_a_supported_emoji(hex_bytes: vector<u8>): bool
    acquires Registry, RegistryAddress {
        table::contains(&borrow_registry_ref().supported_emojis, hex_bytes)
    }

    #[view]
    /// Checks if a sequence of emojis is supported.
    public fun is_supported_emoji_sequence(emojis: vector<vector<u8>>): bool
    acquires Registry, RegistryAddress {
        let symbol_length = 0;
        let supported_emojis_ref = &borrow_registry_ref().supported_emojis;
        for (i in 0..vector::length(&emojis)) {
            let emoji_bytes_ref = vector::borrow(&emojis, i);
            if (!table::contains(supported_emojis_ref, *emoji_bytes_ref)) return false;
            symbol_length = symbol_length + vector::length(emoji_bytes_ref);
        };
        symbol_length <= (MAX_SYMBOL_LENGTH as u64)
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
    public fun simulate_remove_liquidity<Emojicoin>(
        market_address: address,
        provider: address,
        lp_coin_amount: u64,
    ): Liquidity
    acquires Market {
        assert!(exists<Market>(market_address), E_NO_MARKET);
        simulate_remove_liquidity_inner<Emojicoin>(
            provider,
            lp_coin_amount,
            borrow_global(market_address),
        )
    }

    inline fun get_registry_address(): address {
        borrow_global<RegistryAddress>(@emojicoin_dot_fun).registry_address
    }

    inline fun borrow_registry_ref(): &Registry acquires Registry, RegistryAddress {
        borrow_global<Registry>(borrow_global<RegistryAddress>(@emojicoin_dot_fun).registry_address)
    }

    inline fun borrow_registry_ref_mut(): &mut Registry acquires Registry, RegistryAddress {
        borrow_global_mut<Registry>(
            borrow_global<RegistryAddress>(@emojicoin_dot_fun).registry_address
        )
    }

    inline fun burn_lp_coin<Emojicoin, EmojicoinLP>(
        market_address: address,
        coin: Coin<EmojicoinLP>,
    ) acquires LPCoinCapabilities {
        let coin_caps = borrow_global<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address);
        coin::burn<EmojicoinLP>(coin, &coin_caps.burn);
    }

    inline fun mint_lp_coins<Emojicoin, EmojicoinLP>(
        market_address: address,
        amount: u64,
    ): Coin<EmojicoinLP> acquires LPCoinCapabilities {
        let coin_caps = borrow_global<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address);
        coin::mint<EmojicoinLP>(amount, &coin_caps.mint)
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

    inline fun simulate_remove_liquidity_inner<Emojicoin>(
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
        let market_balance_base_u128 = (coin::balance<Emojicoin>(market_address) as u128);
        let market_balance_quote_u128 = (coin::balance<AptosCoin>(market_address) as u128);
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

    #[test_only]
    public fun get_COIN_FACTORY_TYPE_CONSTANTS(): (vector<u8>, vector<u8>, vector<u8>) {
        (
            COIN_FACTORY_AS_BYTES,
            EMOJICOIN_STRUCT_NAME,
            EMOJICOIN_LP_STRUCT_NAME,
        )
    }

    #[test_only]
    public fun get_EMOJICOIN_SUPPLY(): u64 { EMOJICOIN_SUPPLY }

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
        cpamm_simple_swap_output_amount(0, true, Reserves { base: 0, quote: 16 });
    }

    #[test]
    fun test_all_supported_emojis_under_10_bytes() {
        let all_supported_emojis = hex_codes::get_supported_emojis();
        vector::for_each(all_supported_emojis, |bytes| {
            let emoji_as_string = string::utf8(bytes);
            assert!(string::length(&emoji_as_string) <= (MAX_SYMBOL_LENGTH as u64), 0);
        });
    }

    #[test(deployer = @emojicoin_dot_fun, user = @0xFA, aptos_framework = @0x1)]
    fun test_register_market_with_complex_emoji_happy_path(
        deployer: &signer,
        user: &signer,
        aptos_framework: &signer,
    ) acquires Registry, RegistryAddress {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        let coins = coin::mint<AptosCoin>(MARKET_REGISTRATION_FEE, &mint_cap);
        aptos_account::deposit_coins(signer::address_of(user), coins);
        coin::destroy_burn_cap<AptosCoin>(burn_cap);
        coin::destroy_mint_cap<AptosCoin>(mint_cap);

        init_module(deployer);
        let emojis = vector<vector<u8>> [
            x"e29aa1",           // High voltage.
            x"f09f96a5efb88f",   // Desktop computer.
        ];

        let registry_ref_mut = borrow_registry_ref_mut();
        let emoji_bytes = get_verified_emoji_bytes(registry_ref_mut, emojis);

        // Verify market is not already registered.
        let markets_by_emoji_bytes_ref_mut = &mut registry_ref_mut.markets_by_emoji_bytes;
        let already_registered = smart_table::contains(markets_by_emoji_bytes_ref_mut, emoji_bytes);
        assert!(!already_registered, E_ALREADY_REGISTERED);

        create_market(registry_ref_mut, emoji_bytes);
        let utf8_emoji = string::utf8(emoji_bytes);
        assert!(utf8_emoji == string::utf8(x"e29aa1f09f96a5efb88f"), 0);
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
            x"f09f91abf09f8fbe", // Woman and man holding hands medium dark skin tone, 1F46B 1F3FE.
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

        // Specifically test a supported emoji, add some bunk data to it, and make sure it no longer
        // works.
        assert!(is_a_supported_emoji(x"e29d97"), 0);
        assert!(!is_a_supported_emoji(x"e29d97ff"), 0);
        assert!(!is_a_supported_emoji(x"ffe29d97"), 0);
    }

    #[test]
    fun test_valid_coin_types() {
        assert!(valid_coin_types<TestEmojicoin, TestEmojicoinLP>(@emojicoin_dot_fun), 0);
    }

    #[test]
    fun test_invalid_coin_types() {
        // Duplicate types should be invalid.
        assert!(!valid_coin_types<TestEmojicoin, TestEmojicoin>(@emojicoin_dot_fun), 0);
        // Duplicate LP types should be invalid.
        assert!(!valid_coin_types<TestEmojicoinLP, TestEmojicoinLP>(@emojicoin_dot_fun), 0);
        // A bad Emojicoin type should be invalid.
        assert!(!valid_coin_types<BadType, TestEmojicoinLP>(@emojicoin_dot_fun), 0);
        // A bad EmojicoinLP type should be invalid.
        assert!(!valid_coin_types<TestEmojicoin, BadType>(@emojicoin_dot_fun), 0);
        // Backwards coin types that are otherwise valid should be invalid.
        assert!(!valid_coin_types<TestEmojicoinLP, TestEmojicoin>(@emojicoin_dot_fun), 0);
        // An invalid module for the Emojicoin type should be invalid.
        assert!(!valid_coin_types<BadModuleEmojicoin, TestEmojicoinLP>(@emojicoin_dot_fun), 0);
        // An invalid module for the EmojicoinLP type should be invalid.
        assert!(!valid_coin_types<TestEmojicoin, BadModuleEmojicoinLP>(@emojicoin_dot_fun), 0);
        // A market address that doesn't match the types should be invalid.
        assert!(!valid_coin_types<TestEmojicoin, TestEmojicoinLP>(@0xc1de), 0);
    }

    #[test(deployer=@emojicoin_dot_fun), expected_failure(abort_code = E_INVALID_COIN_TYPES)]
    fun test_initialize_coin_types_validates_coin_types(
        deployer: &signer
    ) acquires Market, Registry, RegistryAddress {
        aptos_account::create_account(@emojicoin_dot_fun);
        init_module(deployer);
        let symbol_bytes = x"f09f929b"; // Yellow heart.
        let registry = borrow_registry_ref_mut();
        let (market_address, market_signer) = create_market(registry, symbol_bytes);
        let (market_ref_mut, dupe_signer) = get_market_ref_mut_and_signer_checked(market_address);
        assert!(signer::address_of(&market_signer) == signer::address_of(&dupe_signer), 0);

        ensure_coins_initialized<BadModuleEmojicoin, BadModuleEmojicoinLP>(
            market_ref_mut,
            &market_signer,
            market_address,
        );
    }
}

#[test_only]
module emojicoin_dot_fun::coin_factory {
    struct Emojicoin {}
    struct EmojicoinLP {}
    struct BadType {}
}

#[test_only]
module emojicoin_dot_fun::bad_coin_factory {
    struct Emojicoin {}
    struct EmojicoinLP {}
}
