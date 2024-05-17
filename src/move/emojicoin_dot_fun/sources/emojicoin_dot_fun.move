module emojicoin_dot_fun::emojicoin_dot_fun {

    use aptos_framework::aggregator_v2::{Self, Aggregator, AggregatorSnapshot};
    use aptos_framework::account;
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::code;
    use aptos_framework::coin::{Self, BurnCapability, Coin, MintCapability};
    use aptos_framework::event;
    use aptos_framework::object::{Self, ExtendRef, ObjectGroup};
    use aptos_framework::timestamp;
    use aptos_std::smart_table::{Self, SmartTable};
    use aptos_std::string_utils;
    use aptos_std::table::{Self, Table};
    use aptos_std::type_info;
    use emojicoin_dot_fun::hex_codes;
    use std::option::{Self, Option};
    use std::signer;
    use std::string::{Self, String};
    use std::vector;

    const DECIMALS: u8 = 8;
    const MAX_SYMBOL_LENGTH: u8 = 10;
    const MAX_CHAT_MESSAGE_LENGTH: u64 = 100;
    const MONITOR_SUPPLY: bool = true;

    const COIN_FACTORY_AS_BYTES: vector<u8> = b"coin_factory";
    const EMOJICOIN_NAME_SUFFIX: vector<u8> = b" emojicoin";
    const EMOJICOIN_STRUCT_NAME: vector<u8> = b"Emojicoin";
    const EMOJICOIN_LP_NAME_SUFFIX: vector<u8> = b" emojicoin LP";
    const EMOJICOIN_LP_STRUCT_NAME: vector<u8> = b"EmojicoinLP";
    const EMOJICOIN_LP_SYMBOL_PREFIX: vector<u8> = b"LP-";
    const REGISTRY_NAME: vector<u8> = b"Registry";

    const U64_MAX_AS_u128: u128 = 0xffffffffffffffff;
    const BASIS_POINTS_PER_UNIT: u128 = 10_000;
    const SHIFT_Q64: u8 = 64;
    const HI_128: u128 = 0xffffffffffffffffffffffffffffffff;

    const TRIGGER_PACKAGE_PUBLICATION: u8 = 0;
    const TRIGGER_MARKET_REGISTRATION: u8 = 1;
    const TRIGGER_SWAP_BUY: u8 = 2;
    const TRIGGER_SWAP_SELL: u8 = 3;
    const TRIGGER_PROVIDE_LIQUIDITY: u8 = 4;
    const TRIGGER_REMOVE_LIQUIDITY: u8 = 5;
    const TRIGGER_CHAT: u8 = 6;

    const PERIOD_1M: u64 = 60_000_000;
    const PERIOD_5M: u64 = 300_000_000;
    const PERIOD_15M: u64 = 900_000_000;
    const PERIOD_30M: u64 = 1_800_000_000;
    const PERIOD_1H: u64 = 3_600_000_000;
    const PERIOD_4H: u64 = 14_400_000_000;
    const PERIOD_1D: u64 = 86_400_000_000;

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
    /// No LP coin amount given during liquidity provision/removal.
    const E_LIQUIDITY_NO_LP_COINS: u64 = 5;
    /// The type arguments passed in are invalid.
    const E_INVALID_COIN_TYPES: u64 = 6;
    /// Provided bytes do not indicate a supported coin symbol emoji.
    const E_NOT_SUPPORTED_SYMBOL_EMOJI: u64 = 7;
    /// Too many bytes in emoji symbol.
    const E_EMOJI_BYTES_TOO_LONG: u64 = 8;
    /// Market is already registered.
    const E_ALREADY_REGISTERED: u64 = 9;
    /// Account is unable to pay market registration fee.
    const E_UNABLE_TO_PAY_MARKET_REGISTRATION_FEE: u64 = 10;
    /// Provided bytes do not indicate a supported chat emoji.
    const E_NOT_SUPPORTED_CHAT_EMOJI: u64 = 11;
    /// The constructed chat message exceeds the maximum length.
    const E_CHAT_MESSAGE_TOO_LONG: u64 = 12;
    /// The chat message is empty.
    const E_CHAT_MESSAGE_EMPTY: u64 = 13;
    /// The given emoji index is out of bounds.
    const E_INVALID_EMOJI_INDEX: u64 = 14;

    struct CumulativeStats has copy, drop, store {
        base_volume: u128,
        quote_volume: u128,
        integrator_fees: u128,
        pool_fees_base: u128,
        pool_fees_quote: u128,
        n_swaps: u64,
        n_chat_messages: u64,
    }

    struct LastSwap has copy, drop, store {
        is_sell: bool,
        avg_execution_price_q64: u128,
        base_volume: u64,
        quote_volume: u64,
        nonce: u64,
        time: u64,
    }

    struct MarketMetadata has copy, drop, store {
        market_id: u64,
        market_address: address,
        emoji_bytes: vector<u8>,
    }

    struct TVLtoLPCoinRatio has copy, drop, store {
        tvl: u128,
        lp_coins: u128,
    }

    struct PeriodicStateTracker has copy, drop, store {
        start_time: u64,
        period: u64,
        open_price_q64: u128,
        high_price_q64: u128,
        low_price_q64: u128,
        close_price_q64: u128,
        volume_base: u128,
        volume_quote: u128,
        integrator_fees: u128,
        pool_fees_base: u128,
        pool_fees_quote: u128,
        n_swaps: u64,
        n_chat_messages: u64,
        starts_in_bonding_curve: bool,
        ends_in_bonding_curve: bool,
        tvl_to_lp_coin_ratio_start: TVLtoLPCoinRatio,
        tvl_to_lp_coin_ratio_end: TVLtoLPCoinRatio,
    }

    struct Reserves has copy, drop, store {
        base: u64,
        quote: u64,
    }

    struct SequenceInfo has copy, drop, store {
        nonce: u64,
        last_bump_time: u64,
    }

    struct ParallelizableSequenceInfo has drop, store {
        nonce: Aggregator<u64>,
        last_bump_time: u64,
    }

    #[resource_group = ObjectGroup]
    struct Market has key {
        metadata: MarketMetadata,
        sequence_info: SequenceInfo,
        extend_ref: ExtendRef,
        clamm_virtual_reserves: Reserves,
        cpamm_real_reserves: Reserves,
        lp_coin_supply: u128,
        cumulative_stats: CumulativeStats,
        last_swap: LastSwap,
        periodic_state_trackers: vector<PeriodicStateTracker>,
    }

    struct MarketView has copy, drop, store {
        metadata: MarketMetadata,
        sequence_info: SequenceInfo,
        clamm_virtual_reserves: Reserves,
        cpamm_real_reserves: Reserves,
        lp_coin_supply: u128,
        in_bonding_curve: bool,
        cumulative_stats: CumulativeStats,
        instantaneous_stats: InstantaneousStats,
        last_swap: LastSwap,
        periodic_state_trackers: vector<PeriodicStateTracker>,
        aptos_coin_balance: u64,
        emojicoin_balance: u64,
        emojicoin_lp_balance: u64,
    }

    struct PeriodicStateMetadata has copy, drop, store {
        start_time: u64,
        period: u64,
        emit_time: u64,
        emit_market_nonce: u64,
        trigger: u8,
    }

    #[event]
    struct Chat has copy, drop, store {
        market_metadata: MarketMetadata,
        emit_time: u64,
        emit_market_nonce: u64,
        user: address,
        message: String,
        user_emojicoin_balance: u64,
        circulating_supply: u64,
        balance_as_fraction_of_circulating_supply_q64: u128,
    }

    #[event]
    struct MarketRegistration has copy, drop, store {
        market_metadata: MarketMetadata,
        time: u64,
        registrant: address,
        integrator: address,
        integrator_fee: u64,
    }

    #[event]
    struct PeriodicState has copy, drop, store {
        market_metadata: MarketMetadata,
        periodic_state_metadata: PeriodicStateMetadata,
        open_price_q64: u128,
        high_price_q64: u128,
        low_price_q64: u128,
        close_price_q64: u128,
        volume_base: u128,
        volume_quote: u128,
        integrator_fees: u128,
        pool_fees_base: u128,
        pool_fees_quote: u128,
        n_swaps: u64,
        n_chat_messages: u64,
        starts_in_bonding_curve: bool,
        ends_in_bonding_curve: bool,
        tvl_per_lp_coin_growth_q64: u128,
    }

    struct InstantaneousStats has copy, drop, store {
        total_quote_locked: u64,
        total_value_locked: u128,
        market_cap: u128,
        fully_diluted_value: u128,
    }

    struct StateMetadata has copy, drop, store {
        market_nonce: u64,
        bump_time: u64,
        trigger: u8,
    }

    #[event]
    struct State has copy, drop, store {
        market_metadata: MarketMetadata,
        state_metadata: StateMetadata,
        clamm_virtual_reserves: Reserves,
        cpamm_real_reserves: Reserves,
        lp_coin_supply: u128,
        cumulative_stats: CumulativeStats,
        instantaneous_stats: InstantaneousStats,
        last_swap: LastSwap,
    }

    struct GlobalStats has drop, store {
        cumulative_quote_volume: Aggregator<u128>,
        total_quote_locked: Aggregator<u128>,
        total_value_locked: Aggregator<u128>,
        market_cap: Aggregator<u128>,
        fully_diluted_value: Aggregator<u128>,
        cumulative_integrator_fees: Aggregator<u128>,
        cumulative_swaps: Aggregator<u64>,
        cumulative_chat_messages: Aggregator<u64>,
    }

    #[resource_group = ObjectGroup]
    struct Registry has key {
        registry_address: address,
        sequence_info: ParallelizableSequenceInfo,
        coin_symbol_emojis: Table<vector<u8>, u8>,
        supplemental_chat_emojis: Table<vector<u8>, u8>,
        markets_by_emoji_bytes: SmartTable<vector<u8>, address>,
        markets_by_market_id: SmartTable<u64, address>,
        extend_ref: ExtendRef,
        global_stats: GlobalStats,
    }

    struct RegistryView has drop, store {
        registry_address: address,
        nonce: AggregatorSnapshot<u64>,
        last_bump_time: u64,
        n_markets: u64,
        cumulative_quote_volume: AggregatorSnapshot<u128>,
        total_quote_locked: AggregatorSnapshot<u128>,
        total_value_locked: AggregatorSnapshot<u128>,
        market_cap: AggregatorSnapshot<u128>,
        fully_diluted_value: AggregatorSnapshot<u128>,
        cumulative_integrator_fees: AggregatorSnapshot<u128>,
        cumulative_swaps: AggregatorSnapshot<u64>,
        cumulative_chat_messages: AggregatorSnapshot<u64>,
    }

    #[event]
    struct GlobalState has drop, store {
        emit_time: u64,
        registry_nonce: AggregatorSnapshot<u64>,
        trigger: u8,
        cumulative_quote_volume: AggregatorSnapshot<u128>,
        total_quote_locked: AggregatorSnapshot<u128>,
        total_value_locked: AggregatorSnapshot<u128>,
        market_cap: AggregatorSnapshot<u128>,
        fully_diluted_value: AggregatorSnapshot<u128>,
        cumulative_integrator_fees: AggregatorSnapshot<u128>,
        cumulative_swaps: AggregatorSnapshot<u64>,
        cumulative_chat_messages: AggregatorSnapshot<u64>,
    }

    #[event]
    struct Swap has copy, drop, store {
        market_id: u64,
        time: u64,
        market_nonce: u64,
        swapper: address,
        input_amount: u64,
        is_sell: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
        net_proceeds: u64,
        base_volume: u64,
        quote_volume: u64,
        avg_execution_price_q64: u128,
        integrator_fee: u64,
        pool_fee: u64,
        starts_in_bonding_curve: bool,
        results_in_state_transition: bool,
    }

    #[resource_group = ObjectGroup]
    struct LPCoinCapabilities<phantom Emojicoin, phantom EmojicoinLP> has key {
        burn: BurnCapability<EmojicoinLP>,
        mint: MintCapability<EmojicoinLP>,
    }

    #[event]
    struct Liquidity has copy, drop, store {
        market_id: u64,
        time: u64,
        market_nonce: u64,
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

    /// Constructs a chat message from a sequence of emojis emitted as an event.
    /// Example:
    ///     emoji_bytes: [ x"00", x"01", x"02" ], // Pretend these are valid emojis.
    ///     emoji_indices_sequence: [ 0, 1, 2, 2, 2, 1, 2, 1 ],
    /// This would result in a message of:
    ///     [ x"00", x"01", x"02", x"02", x"02", x"01", x"02", x"01" ]
    public entry fun chat<Emojicoin, EmojicoinLP>(
        user: &signer,
        market_address: address,
        emoji_bytes: vector<vector<u8>>, // The individual emojis to use.
        emoji_indices_sequence: vector<u8>, // Sequence of indices used to construct a chat message.
    ) acquires Market, Registry, RegistryAddress {

        // Mutably borrow market and check its coin types.
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        ensure_coins_initialized<Emojicoin, EmojicoinLP>(
            market_ref_mut,
            &market_signer,
            market_address,
        );

        // Verify chat message length.
        let message_length = vector::length(&emoji_indices_sequence);
        assert!(message_length <= MAX_CHAT_MESSAGE_LENGTH, E_CHAT_MESSAGE_TOO_LONG);
        assert!(message_length > 0, E_CHAT_MESSAGE_EMPTY);

        // Construct the chat message from the emoji indices, checking index and emoji validity.
        let message: String = string::utf8(b"");
        let n_emojis = vector::length(&emoji_bytes);
        vector::for_each(emoji_indices_sequence, |idx| {
            assert!((idx as u64) < n_emojis, E_INVALID_EMOJI_INDEX);
            let emoji = *vector::borrow(&emoji_bytes, (idx as u64));
            assert!(is_a_supported_chat_emoji(emoji), E_NOT_SUPPORTED_CHAT_EMOJI);
            string::append_utf8(&mut message, emoji);
        });

        // Prep local variables.
        let user_address = signer::address_of(user);
        let registry_ref_mut = borrow_registry_ref_mut();
        let lp_coin_supply = market_ref_mut.lp_coin_supply;
        let in_bonding_curve = lp_coin_supply == 0;

        // Trigger periodic state.
        let time = timestamp::now_microseconds();
        let tvl = tvl(market_ref_mut, in_bonding_curve);
        let trigger = TRIGGER_CHAT;
        trigger_periodic_state(market_ref_mut, registry_ref_mut, time, trigger, tvl);

        // Update number of chat messages locally and globally.
        let local_cumulative_stats_ref_mut = &mut market_ref_mut.cumulative_stats;
        let global_stats_ref_mut = &mut registry_ref_mut.global_stats;
        let local_cumulative_n_chat_messages = &mut local_cumulative_stats_ref_mut.n_chat_messages;
        *local_cumulative_n_chat_messages = *local_cumulative_n_chat_messages + 1;
        let global_cumulative_chat_messages_ref_mut =
            &mut global_stats_ref_mut.cumulative_chat_messages;
        aggregator_v2::try_add(global_cumulative_chat_messages_ref_mut, 1);

        // Update periodic state trackers.
        vector::for_each_mut(&mut market_ref_mut.periodic_state_trackers, |e| {
            // Type declaration per https://github.com/aptos-labs/aptos-core/issues/9508.
            let tracker_ref_mut: &mut PeriodicStateTracker = e;
            tracker_ref_mut.n_chat_messages = tracker_ref_mut.n_chat_messages + 1;
        });

        // Emit chat event.
        let (supply_minuend, reserves_ref) =
            assign_supply_minuend_reserves_ref(market_ref_mut, in_bonding_curve);
        let circulating_supply = supply_minuend - reserves_ref.base;
        let user_emojicoin_balance = if (!coin::is_account_registered<Emojicoin>(user_address)) {
            if (!account::exists_at(user_address)) {
                aptos_account::create_account(user_address);
            };
            coin::register<Emojicoin>(user);
            0
        } else {
            coin::balance<Emojicoin>(user_address)
        };
        let balance_as_fraction = if (circulating_supply == 0) {
            0
        } else {
            ((user_emojicoin_balance as u128) << SHIFT_Q64) / (circulating_supply as u128)
        };
        event::emit(Chat {
            market_metadata: market_ref_mut.metadata,
            emit_time: time,
            emit_market_nonce: market_ref_mut.sequence_info.nonce,
            user: user_address,
            message,
            user_emojicoin_balance,
            circulating_supply,
            balance_as_fraction_of_circulating_supply_q64: balance_as_fraction,
        });

        // Bump market state.
        let (fdv, market_cap) = fdv_market_cap(*reserves_ref, supply_minuend);
        let total_quote_locked = total_quote_locked(market_ref_mut, in_bonding_curve);
        bump_market_state(
            market_ref_mut,
            trigger,
            InstantaneousStats {
                total_quote_locked: total_quote_locked,
                total_value_locked: tvl,
                market_cap: market_cap,
                fully_diluted_value: fdv,
            },
        );
    }

    public entry fun register_market(
        registrant: &signer,
        emojis: vector<vector<u8>>,
        integrator: address,
    ) acquires Market, Registry, RegistryAddress {
        register_market_inner(registrant, emojis, integrator, true);
    }

    fun register_market_inner(
        registrant: &signer,
        emojis: vector<vector<u8>>,
        integrator: address,
        publish_code: bool,
    ) acquires Market, Registry, RegistryAddress {
        let registry_ref_mut = borrow_registry_ref_mut();

        // Verify well-formed emoji bytes.
        let emoji_bytes = get_verified_symbol_emoji_bytes(registry_ref_mut, emojis);

        // Verify market is not already registered.
        let markets_by_emoji_bytes_ref = &registry_ref_mut.markets_by_emoji_bytes;
        let already_registered = smart_table::contains(markets_by_emoji_bytes_ref, emoji_bytes);
        assert!(!already_registered, E_ALREADY_REGISTERED);

        // Create the Market object and add it to the registry.
        let (market_address, market_signer) = create_market(registry_ref_mut, emoji_bytes);
        let market_ref_mut = borrow_global_mut<Market>(market_address);

        // Trigger periodic state in case global state has lapsed.
        let time = timestamp::now_microseconds();
        let trigger = TRIGGER_MARKET_REGISTRATION;
        trigger_periodic_state(market_ref_mut, registry_ref_mut, time, trigger, 0);

        // Publish coin types at market address, unless publication disabled for testing.
        if (publish_code) {
            let (metadata_bytecode, module_bytecode) = hex_codes::get_publish_code(market_address);
            code::publish_package_txn(&market_signer, metadata_bytecode, vector[module_bytecode]);
        };

        // Waive market registration fee if registrant assumes the gas cost of initializing the
        // supplemental chat emojis table during the registration of the first market, an operation
        // that is roughly equal in cost to the static market registration fee. Else, charge fee.
        let registrant_address = signer::address_of(registrant);
        let registrant_assumes_cost_of_initializing_supplemental_chat_emojis =
            ensure_supplemental_chat_emojis_initialized(registry_ref_mut);
        let integrator_fee = if (registrant_assumes_cost_of_initializing_supplemental_chat_emojis) {
            0
        } else {
            let fee = MARKET_REGISTRATION_FEE;
            let can_pay_fee =
                coin::is_account_registered<AptosCoin>(registrant_address) &&
                coin::balance<AptosCoin>(registrant_address) >= fee;
            assert!(can_pay_fee, E_UNABLE_TO_PAY_MARKET_REGISTRATION_FEE);
            aptos_account::transfer(registrant, integrator, fee);

            // Update global integrator fees.
            let global_cumulative_integrator_fees_ref_mut =
                &mut registry_ref_mut.global_stats.cumulative_integrator_fees;
            aggregator_v2::try_add(global_cumulative_integrator_fees_ref_mut, (fee as u128));

            fee
        };

        // Update global FDV.
        let fdv = fdv(market_ref_mut.clamm_virtual_reserves);
        let fdv_ref_mut = &mut registry_ref_mut.global_stats.fully_diluted_value;
        aggregator_v2::try_add(fdv_ref_mut, fdv);

        // Bump state.
        event::emit(MarketRegistration {
            market_metadata: market_ref_mut.metadata,
            time,
            registrant: registrant_address,
            integrator,
            integrator_fee,
        });
        bump_market_state(
            market_ref_mut,
            TRIGGER_MARKET_REGISTRATION,
            InstantaneousStats {
                total_quote_locked: 0,
                total_value_locked: 0,
                market_cap: 0,
                fully_diluted_value: fdv,
            },
        );
    }

    /*inline*/ fun instantaneous_stats(market_ref: &Market): InstantaneousStats {
        let lp_coin_supply = market_ref.lp_coin_supply;
        let in_bonding_curve = lp_coin_supply == 0;
        let total_quote_locked = total_quote_locked(market_ref, in_bonding_curve);
        let tvl = tvl(market_ref, in_bonding_curve);
        let (supply_minuend, reserves_ref) =
            assign_supply_minuend_reserves_ref(market_ref, in_bonding_curve);
        let (fdv, market_cap) = fdv_market_cap(*reserves_ref, supply_minuend);
        InstantaneousStats {
            total_quote_locked,
            total_value_locked: tvl,
            market_cap,
            fully_diluted_value: fdv,
        }
    }

    /*inline*/ fun create_market(
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

        // Only assess integrator fees for markets after the first.
        let integrator_fees = if (market_id == 1) 0 else (MARKET_REGISTRATION_FEE as u128);

        let time = timestamp::now_microseconds();
        move_to(&market_signer, Market {
            metadata : MarketMetadata {
                market_id,
                market_address,
                emoji_bytes,
            },
            sequence_info: SequenceInfo {
                last_bump_time: timestamp::now_microseconds(),
                nonce: 0,
            },
            extend_ref: market_extend_ref,
            clamm_virtual_reserves:
                Reserves { base: BASE_VIRTUAL_CEILING, quote: QUOTE_VIRTUAL_FLOOR },
            cpamm_real_reserves: Reserves { base: 0, quote: 0 },
            lp_coin_supply: 0,
            cumulative_stats: CumulativeStats {
                base_volume: 0,
                quote_volume: 0,
                integrator_fees,
                pool_fees_base: 0,
                pool_fees_quote: 0,
                n_swaps: 0,
                n_chat_messages: 0,
            },
            last_swap: LastSwap {
                is_sell: false,
                avg_execution_price_q64: 0,
                base_volume: 0,
                quote_volume: 0,
                nonce: 0,
                time: 0,
            },
            periodic_state_trackers: vector::map(
                vector[
                    PERIOD_1M,
                    PERIOD_5M,
                    PERIOD_15M,
                    PERIOD_30M,
                    PERIOD_1H,
                    PERIOD_4H,
                    PERIOD_1D,
                ],
                |period| PeriodicStateTracker {
                    start_time: last_period_boundary(time, period),
                    period,
                    open_price_q64: 0,
                    high_price_q64: 0,
                    low_price_q64: 0,
                    close_price_q64: 0,
                    volume_base: 0,
                    volume_quote: 0,
                    integrator_fees,
                    pool_fees_base: 0,
                    pool_fees_quote: 0,
                    n_swaps: 0,
                    n_chat_messages: 0,
                    starts_in_bonding_curve: true,
                    ends_in_bonding_curve: true,
                    tvl_to_lp_coin_ratio_start: TVLtoLPCoinRatio { tvl: 0, lp_coins: 0 },
                    tvl_to_lp_coin_ratio_end: TVLtoLPCoinRatio { tvl: 0, lp_coins: 0 },
                }
            ),
        });
        // Update registry.
        smart_table::add(markets_by_emoji_bytes_ref_mut, emoji_bytes, market_address);
        smart_table::add(&mut registry_ref_mut.markets_by_market_id, market_id, market_address);

        (market_address, market_signer)
    }

    /*inline*/ fun valid_coin_types<Emojicoin, EmojicoinLP>(market_address: address): bool {
        let emoji_type = &type_info::type_of<Emojicoin>();
        let lp_type = &type_info::type_of<EmojicoinLP>();

        type_info::account_address(emoji_type) == market_address    &&
        type_info::account_address(lp_type) == market_address       &&
        type_info::module_name(emoji_type) == COIN_FACTORY_AS_BYTES &&
        type_info::module_name(lp_type) == COIN_FACTORY_AS_BYTES    &&
        type_info::struct_name(emoji_type) == EMOJICOIN_STRUCT_NAME &&
        type_info::struct_name(lp_type) == EMOJICOIN_LP_STRUCT_NAME
    }

    /*inline*/ fun get_verified_symbol_emoji_bytes(
        registry_ref: &Registry,
        emojis: vector<vector<u8>>,
    ): vector<u8> {
        let coin_symbol_emojis_ref = &registry_ref.coin_symbol_emojis;
        let verified_bytes = vector[];
        for (i in 0..vector::length(&emojis)) {
            let emoji = *vector::borrow(&emojis, i);
            assert!(table::contains(coin_symbol_emojis_ref, emoji), E_NOT_SUPPORTED_SYMBOL_EMOJI);
            vector::append(&mut verified_bytes, emoji);
        };
        assert!(
            vector::length(&verified_bytes) <= (MAX_SYMBOL_LENGTH as u64),
            E_EMOJI_BYTES_TOO_LONG
        );

        verified_bytes
    }

    /*inline*/ fun mul_div(
        a: u64,
        b: u64,
        c: u64,
    ): u128 {
        (a as u128) * (b as u128) / (c as u128)
    }

    /*inline*/ fun assert_valid_coin_types<Emojicoin, EmojicoinLP>(market_address: address) {
        assert!(
            exists<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address),
            E_INVALID_COIN_TYPES
        );
    }

    /*inline*/ fun fdv_market_cap_start_end(
        reserves_start: Reserves,
        reserves_end: Reserves,
        supply_minuend: u64,
    ): (
        u128, // FDV at start.
        u128, // Market cap at start.
        u128, // FDV at end.
        u128, // Market cap at end.
    ) {
        let (fdv_start, market_cap_start) = fdv_market_cap(reserves_start, supply_minuend);
        let (fdv_end, market_cap_end) = fdv_market_cap(reserves_end, supply_minuend);
        (fdv_start, market_cap_start, fdv_end, market_cap_end)
    }

    /*inline*/ fun fdv(
        reserves: Reserves,
    ): u128 {
        mul_div(reserves.quote, EMOJICOIN_SUPPLY, reserves.base)
    }

    /*inline*/ fun fdv_market_cap(
        reserves: Reserves,
        supply_minuend: u64,
    ): (
        u128, // FDV.
        u128, // Market cap.
    ) {
        let base = reserves.base;
        let quote = reserves.quote;
        (
            mul_div(quote, EMOJICOIN_SUPPLY, base), // FDV.
            mul_div(quote, supply_minuend - base, base), // Market cap.
        )
    }

    inline fun is_a_supported_chat_emoji_inner(emoji: vector<u8>): bool {
        let registry_ref = borrow_registry_ref();
        table::contains(&registry_ref.coin_symbol_emojis, emoji) ||
        table::contains(&registry_ref.supplemental_chat_emojis, emoji)
    }

    inline fun assign_supply_minuend_reserves_ref_mut(
        market_ref_mut: &mut Market,
        starts_in_bonding_curve: bool
    ): (
        u64,
        &mut Reserves,
    ) {
        if (starts_in_bonding_curve) {
            (BASE_VIRTUAL_CEILING, &mut market_ref_mut.clamm_virtual_reserves)
        } else {
            (EMOJICOIN_SUPPLY, &mut market_ref_mut.cpamm_real_reserves)
        }
    }

    inline fun assign_supply_minuend_reserves_ref(
        market_ref: &Market,
        in_bonding_curve: bool
    ): (
        u64,
        &Reserves,
    ) {
        if (in_bonding_curve) {
            (BASE_VIRTUAL_CEILING, &market_ref.clamm_virtual_reserves)
        } else {
            (EMOJICOIN_SUPPLY, &market_ref.cpamm_real_reserves)
        }
    }

    /*inline*/ fun ensure_coins_initialized<Emojicoin, EmojicoinLP>(
        market_ref: &Market,
        market_signer: &signer,
        market_address: address,
    ) {
        if (!exists<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address)) {
            assert!(valid_coin_types<Emojicoin, EmojicoinLP>(market_address), E_INVALID_COIN_TYPES);
            let symbol = string::utf8(market_ref.metadata.emoji_bytes);

            // Initialize emojicoin with fixed supply, throw away capabilities.
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<Emojicoin>(
                market_signer,
                get_concatenation(symbol, string::utf8(EMOJICOIN_NAME_SUFFIX)),
                symbol,
                DECIMALS,
                MONITOR_SUPPLY,
            );
            let emojicoins = coin::mint<Emojicoin>(EMOJICOIN_SUPPLY, &mint_cap);
            aptos_account::deposit_coins(market_address, emojicoins);
            coin::destroy_freeze_cap(freeze_cap);
            coin::destroy_mint_cap(mint_cap);
            coin::destroy_burn_cap(burn_cap);

            let market_id_str = string_utils::to_string(&market_ref.metadata.market_id);
            let lp_symbol = get_concatenation(
                string::utf8(EMOJICOIN_LP_SYMBOL_PREFIX),
                market_id_str,
            );
            // Initialize LP coin, storing only burn and mint capabilities.
            let (burn_cap, freeze_cap, mint_cap) = coin::initialize<EmojicoinLP>(
                market_signer,
                get_concatenation(symbol, string::utf8(EMOJICOIN_LP_NAME_SUFFIX)),
                lp_symbol,
                DECIMALS,
                MONITOR_SUPPLY,
            );
            coin::register<EmojicoinLP>(market_signer);
            coin::destroy_freeze_cap(freeze_cap);
            move_to(market_signer, LPCoinCapabilities<Emojicoin, EmojicoinLP> {
                burn: burn_cap,
                mint: mint_cap,
            });
        };
    }

    /*inline*/ fun get_concatenation(base: String, additional: String): String {
        string::append(&mut base, additional);
        base
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

    inline fun get_market_ref_and_signer_checked(market_address: address): (
        &Market,
        signer,
    ) acquires Market {
        assert!(exists<Market>(market_address), E_NO_MARKET);
        let market_ref = borrow_global<Market>(market_address);
        let market_signer = object::generate_signer_for_extending(&market_ref.extend_ref);
        (market_ref, market_signer)
    }

    public entry fun swap<Emojicoin, EmojicoinLP>(
        swapper: &signer,
        market_address: address,
        input_amount: u64,
        is_sell: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
    ) acquires LPCoinCapabilities, Market, Registry, RegistryAddress {

        // Mutably borrow market, check its coin types, then simulate a swap.
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        ensure_coins_initialized<Emojicoin, EmojicoinLP>(
            market_ref_mut,
            &market_signer,
            market_address,
        );
        let swapper_address = signer::address_of(swapper);
        let event = simulate_swap_inner(
            swapper_address,
            input_amount,
            is_sell,
            integrator,
            integrator_fee_rate_bps,
            market_ref_mut,
        );

        // Get TVL before swap, use it to update periodic state.
        let starts_in_bonding_curve = event.starts_in_bonding_curve;
        let tvl_start = tvl(market_ref_mut, starts_in_bonding_curve);
        let registry_ref_mut = borrow_registry_ref_mut();
        let time = event.time;
        let trigger = if (is_sell) TRIGGER_SWAP_SELL else TRIGGER_SWAP_BUY;
        trigger_periodic_state(market_ref_mut, registry_ref_mut, time, trigger, tvl_start);

        // Prepare local variables.
        let quote_volume_as_u128 = (event.quote_volume as u128);
        let base_volume_as_u128 = (event.base_volume as u128);
        let local_cumulative_stats_ref_mut = &mut market_ref_mut.cumulative_stats;
        let global_stats_ref_mut = &mut registry_ref_mut.global_stats;
        let total_quote_locked_ref_mut = &mut global_stats_ref_mut.total_quote_locked;
        let market_cap_ref_mut = &mut global_stats_ref_mut.market_cap;
        let fdv_ref_mut = &mut global_stats_ref_mut.fully_diluted_value;
        let pool_fees_base_as_u128 = 0;
        let pool_fees_quote_as_u128 = 0;
        let (quote, fdv_start, market_cap_start, fdv_end, market_cap_end);
        let results_in_state_transition = event.results_in_state_transition;
        let ends_in_bonding_curve = starts_in_bonding_curve && !results_in_state_transition;

        // Create for swapper an account with AptosCoin store if it doesn't exist.
        if (!account::exists_at(swapper_address)) {
            aptos_account::create_account(swapper_address);
        };
        coin::register<AptosCoin>(swapper);

        if (is_sell) { // If selling, no possibility of state transition.

            // Transfer funds.
            coin::register<Emojicoin>(swapper); // For better feedback if insufficient funds.
            coin::transfer<Emojicoin>(swapper, market_address, input_amount);
            let quote_leaving_market = event.quote_volume + event.integrator_fee;
            quote = coin::withdraw<AptosCoin>(&market_signer, quote_leaving_market);
            let net_proceeds = coin::extract(&mut quote, event.quote_volume);
            aptos_account::deposit_coins(swapper_address, net_proceeds);

            // Get minuend for circulating supply calculations and affected reserves.
            let (supply_minuend, reserves_ref_mut) = assign_supply_minuend_reserves_ref_mut(
                market_ref_mut,
                starts_in_bonding_curve,
            );

            // Update reserve amounts.
            let reserves_start = *reserves_ref_mut;
            let reserves_end = reserves_start;
            reserves_end.base = reserves_end.base + event.input_amount;
            reserves_end.quote = reserves_end.quote - quote_leaving_market;
            *reserves_ref_mut = reserves_end;

            // Get FDV, market cap at start and end.
            (fdv_start, market_cap_start, fdv_end, market_cap_end) =
                fdv_market_cap_start_end(reserves_start, reserves_end, supply_minuend);

            // Update global stats.
            aggregator_v2::try_sub(total_quote_locked_ref_mut, (quote_leaving_market as u128));
            aggregator_v2::try_sub(market_cap_ref_mut, market_cap_start - market_cap_end);
            aggregator_v2::try_sub(fdv_ref_mut, fdv_start - fdv_end);

            // Update cumulative pool fees.
            let local_cumulative_pool_fees_quote_ref_mut =
                &mut local_cumulative_stats_ref_mut.pool_fees_quote;
            pool_fees_quote_as_u128 = (event.pool_fee as u128);
            *local_cumulative_pool_fees_quote_ref_mut =
                *local_cumulative_pool_fees_quote_ref_mut + pool_fees_quote_as_u128;

        } else { // If buying, might need to buy through the state transition.

            // Transfer funds.
            quote = coin::withdraw<AptosCoin>(swapper, input_amount);
            coin::deposit(market_address, coin::extract(&mut quote, event.quote_volume));
            aptos_account::transfer_coins<Emojicoin>(
                &market_signer,
                swapper_address,
                event.base_volume,
            );

            if (results_in_state_transition) { // Buy with state transition.
                // Mint initial liquidity provider coins.
                let lp_coins =
                    mint_lp_coins<Emojicoin, EmojicoinLP>(market_address, LP_TOKENS_INITIAL);
                coin::deposit<EmojicoinLP>(market_address, lp_coins);
                market_ref_mut.lp_coin_supply = (LP_TOKENS_INITIAL as u128);

                // Assign minuend for circulating supply calculations.
                let supply_minuend_start = BASE_VIRTUAL_CEILING;
                let supply_minuend_end = EMOJICOIN_SUPPLY;

                // Determine CLAMM transition variables, then zero out CLAMM reserves.
                let clamm_virtual_reserves_ref_mut = &mut market_ref_mut.clamm_virtual_reserves;
                let reserves_start = *clamm_virtual_reserves_ref_mut;
                let quote_to_transition = QUOTE_VIRTUAL_CEILING - reserves_start.quote;
                let base_left_in_clamm = reserves_start.base - BASE_VIRTUAL_FLOOR;
                *clamm_virtual_reserves_ref_mut = Reserves { base: 0, quote: 0 };

                // Determine ending CPAMM reserve amounts after seeding with initial liquidity.
                let quote_into_cpamm = event.quote_volume - quote_to_transition;
                let base_out_of_cpamm = event.base_volume - base_left_in_clamm;
                let reserves_end = Reserves {
                    base: EMOJICOIN_REMAINDER - base_out_of_cpamm,
                    quote: QUOTE_REAL_CEILING + quote_into_cpamm,
                };
                market_ref_mut.cpamm_real_reserves = reserves_end;

                // Get FDV and market cap at start and end.
                (fdv_start, market_cap_start) =
                    fdv_market_cap(reserves_start, supply_minuend_start);
                (fdv_end, market_cap_end) =
                    fdv_market_cap(reserves_end, supply_minuend_end);

            } else { // Buy without state transition.

                // Get minuend for circulating supply calculations and affected reserves.
                let (supply_minuend, reserves_ref_mut) = assign_supply_minuend_reserves_ref_mut(
                    market_ref_mut,
                    starts_in_bonding_curve,
                );

                // Update reserve amounts.
                let reserves_start = *reserves_ref_mut;
                let reserves_end = reserves_start;
                reserves_end.base = reserves_end.base - event.base_volume;
                reserves_end.quote = reserves_end.quote + event.quote_volume;
                *reserves_ref_mut = reserves_end;

                // Get FDV, market cap at start and end.
                (fdv_start, market_cap_start, fdv_end, market_cap_end) =
                    fdv_market_cap_start_end(reserves_start, reserves_end, supply_minuend);

            };

            // Update global stats.
            aggregator_v2::try_add(total_quote_locked_ref_mut, quote_volume_as_u128);
            aggregator_v2::try_add(market_cap_ref_mut, market_cap_end - market_cap_start);
            aggregator_v2::try_add(fdv_ref_mut, fdv_end - fdv_start);

            // Update cumulative pool fees.
            let local_cumulative_pool_fees_base_ref_mut =
                &mut local_cumulative_stats_ref_mut.pool_fees_base;
            pool_fees_base_as_u128 = (event.pool_fee as u128);
            *local_cumulative_pool_fees_base_ref_mut =
                *local_cumulative_pool_fees_base_ref_mut + pool_fees_base_as_u128;
        };

        aptos_account::deposit_coins(integrator, quote); // Deposit integrator's fees.

        // Update cumulative volume locally and globally.
        let local_cumulative_base_volume_ref_mut = &mut local_cumulative_stats_ref_mut.base_volume;
        let local_cumulative_quote_volume_ref_mut =
            &mut local_cumulative_stats_ref_mut.quote_volume;
        *local_cumulative_base_volume_ref_mut =
            *local_cumulative_base_volume_ref_mut + base_volume_as_u128;
        *local_cumulative_quote_volume_ref_mut =
            *local_cumulative_quote_volume_ref_mut + quote_volume_as_u128;
        let global_cumulative_quote_volume_ref_mut =
            &mut global_stats_ref_mut.cumulative_quote_volume;
        aggregator_v2::try_add(global_cumulative_quote_volume_ref_mut, quote_volume_as_u128);

        // Update integrator fees locally and globally.
        let integrator_fee_as_u128 = (event.integrator_fee as u128);
        let local_cumulative_integrator_fees_ref_mut =
            &mut local_cumulative_stats_ref_mut.integrator_fees;
        *local_cumulative_integrator_fees_ref_mut =
            *local_cumulative_integrator_fees_ref_mut + integrator_fee_as_u128;
        let global_cumulative_integrator_fees_ref_mut =
            &mut global_stats_ref_mut.cumulative_integrator_fees;
        aggregator_v2::try_add(global_cumulative_integrator_fees_ref_mut, integrator_fee_as_u128);

        // Update number of swaps locally and globally.
        let local_cumulative_n_swaps = &mut local_cumulative_stats_ref_mut.n_swaps;
        *local_cumulative_n_swaps = *local_cumulative_n_swaps + 1;
        let global_cumulative_swaps_ref_mut = &mut global_stats_ref_mut.cumulative_swaps;
        aggregator_v2::try_add(global_cumulative_swaps_ref_mut, 1);

        // Update global TVL amounts.
        let lp_coin_supply = market_ref_mut.lp_coin_supply;
        let tvl_end = tvl(market_ref_mut, ends_in_bonding_curve);
        let global_total_value_locked_ref_mut = &mut global_stats_ref_mut.total_value_locked;
        if (tvl_end > tvl_start) {
            let tvl_increase = tvl_end - tvl_start;
            aggregator_v2::try_add(global_total_value_locked_ref_mut, tvl_increase);
        } else {
            let tvl_decrease = tvl_start - tvl_end;
            aggregator_v2::try_sub(global_total_value_locked_ref_mut, tvl_decrease);
        };

        // Update last swap info.
        let last_swap_ref_mut = &mut market_ref_mut.last_swap;
        let avg_execution_price_q64 = event.avg_execution_price_q64;
        *last_swap_ref_mut = LastSwap {
            is_sell,
            avg_execution_price_q64,
            base_volume: event.base_volume,
            quote_volume: event.quote_volume,
            nonce: event.market_nonce,
            time: time,
        };

        // Update periodic state trackers, emit swap event.
        vector::for_each_mut(&mut market_ref_mut.periodic_state_trackers, |e| {
            // Type declaration per https://github.com/aptos-labs/aptos-core/issues/9508.
            let tracker_ref_mut: &mut PeriodicStateTracker = e;
            if (tracker_ref_mut.open_price_q64 == 0) {
                tracker_ref_mut.open_price_q64 = avg_execution_price_q64;
            };
            if (avg_execution_price_q64 > tracker_ref_mut.high_price_q64) {
                tracker_ref_mut.high_price_q64 = avg_execution_price_q64;
            };
            if (tracker_ref_mut.low_price_q64 == 0 ||
                avg_execution_price_q64 < tracker_ref_mut.low_price_q64) {
                tracker_ref_mut.low_price_q64 = avg_execution_price_q64;
            };
            tracker_ref_mut.close_price_q64 = avg_execution_price_q64;
            tracker_ref_mut.volume_base =
                tracker_ref_mut.volume_base + base_volume_as_u128;
            tracker_ref_mut.volume_quote =
                tracker_ref_mut.volume_quote + quote_volume_as_u128;
            tracker_ref_mut.integrator_fees =
                tracker_ref_mut.integrator_fees + integrator_fee_as_u128;
            tracker_ref_mut.pool_fees_base =
                tracker_ref_mut.pool_fees_base + pool_fees_base_as_u128;
            tracker_ref_mut.pool_fees_quote =
                tracker_ref_mut.pool_fees_quote + pool_fees_quote_as_u128;
            tracker_ref_mut.tvl_to_lp_coin_ratio_end.tvl = tvl_end;
            tracker_ref_mut.tvl_to_lp_coin_ratio_end.lp_coins = lp_coin_supply;
            tracker_ref_mut.n_swaps = tracker_ref_mut.n_swaps + 1;
            tracker_ref_mut.ends_in_bonding_curve = ends_in_bonding_curve;
        });
        event::emit(event);

        // Get ending total quote locked, bump market state.
        let total_quote_locked_end = total_quote_locked(market_ref_mut, ends_in_bonding_curve);
        bump_market_state(
            market_ref_mut,
            trigger,
            InstantaneousStats {
                total_quote_locked: total_quote_locked_end,
                total_value_locked: tvl_end,
                market_cap: market_cap_end,
                fully_diluted_value: fdv_end,
            },
        );
    }

    public entry fun provide_liquidity<Emojicoin, EmojicoinLP>(
        provider: &signer,
        market_address: address,
        quote_amount: u64,
    ) acquires LPCoinCapabilities, Market, Registry, RegistryAddress {

        // Sanitize inputs, set up local variables.
        let (market_ref_mut, _) = get_market_ref_mut_and_signer_checked(market_address);
        assert_valid_coin_types<Emojicoin, EmojicoinLP>(market_address);
        let provider_address = signer::address_of(provider);
        let event = simulate_provide_liquidity_inner(
            provider_address,
            quote_amount,
            market_ref_mut,
        );
        let registry_ref_mut = borrow_registry_ref_mut();

        // Get TVL before operations, use it to update periodic state.
        let tvl_start = tvl_cpamm(market_ref_mut.cpamm_real_reserves.quote);
        let time = event.time;
        let trigger = TRIGGER_PROVIDE_LIQUIDITY;
        trigger_periodic_state(market_ref_mut, registry_ref_mut, time, trigger, tvl_start);

        // Store reserves at start of operation.
        let reserves_start = market_ref_mut.cpamm_real_reserves;

        // Transfer coins.
        coin::transfer<Emojicoin>(provider, market_address, event.base_amount);
        coin::transfer<AptosCoin>(provider, market_address, event.quote_amount);
        let lp_coins = mint_lp_coins<Emojicoin, EmojicoinLP>(
            market_ref_mut.metadata.market_address,
            event.lp_coin_amount,
        );
        aptos_account::deposit_coins(provider_address, lp_coins);

        // Update market state.
        let reserves_ref_mut = &mut market_ref_mut.cpamm_real_reserves;
        let quote_reserves_ref_mut = &mut reserves_ref_mut.quote;
        let start_quote = *quote_reserves_ref_mut;
        reserves_ref_mut.base = reserves_ref_mut.base + event.base_amount;
        *quote_reserves_ref_mut = start_quote + event.quote_amount;
        let lp_coin_supply = market_ref_mut.lp_coin_supply + (event.lp_coin_amount as u128);
        market_ref_mut.lp_coin_supply = lp_coin_supply;
        let tvl_end = tvl_cpamm(*quote_reserves_ref_mut);

        // Update global total quote locked, TVL.
        let global_stats_ref_mut = &mut registry_ref_mut.global_stats;
        let global_total_quote_locked_ref_mut = &mut global_stats_ref_mut.total_quote_locked;
        let global_total_value_locked_ref_mut = &mut global_stats_ref_mut.total_value_locked;
        let delta_tvl = tvl_end - tvl_start;
        aggregator_v2::try_add(global_total_quote_locked_ref_mut, (event.quote_amount as u128));
        aggregator_v2::try_add(global_total_value_locked_ref_mut, delta_tvl);

        // Get FDV, market cap, at start and end of operation, update global stats accordingly.
        let (fdv_start, market_cap_start, fdv_end, market_cap_end) =
            fdv_market_cap_start_end(reserves_start, *reserves_ref_mut, EMOJICOIN_SUPPLY);
        update_global_fdv_market_cap_for_liquidity_operation(
            fdv_start,
            market_cap_start,
            fdv_end,
            market_cap_end,
            global_stats_ref_mut,
        );

        // Emit liquidity provision event, follow up on periodic state trackers/market state.
        event::emit(event);
        liquidity_provision_operation_epilogue(
            tvl_end,
            fdv_end,
            market_cap_end,
            lp_coin_supply,
            reserves_ref_mut.quote,
            trigger,
            market_ref_mut,
        );
    }

    public entry fun remove_liquidity<Emojicoin, EmojicoinLP>(
        provider: &signer,
        market_address: address,
        lp_coin_amount: u64,
    ) acquires LPCoinCapabilities, Market, Registry, RegistryAddress {

        // Sanitize inputs, set up local variables.
        let (market_ref_mut, market_signer) = get_market_ref_mut_and_signer_checked(market_address);
        assert_valid_coin_types<Emojicoin, EmojicoinLP>(market_address);
        let provider_address = signer::address_of(provider);
        let event = simulate_remove_liquidity_inner<Emojicoin>(
            provider_address,
            lp_coin_amount,
            market_ref_mut,
        );
        let registry_ref_mut = borrow_registry_ref_mut();

        // Get TVL before operations, use it to update periodic state.
        let tvl_start = tvl_cpamm(market_ref_mut.cpamm_real_reserves.quote);
        let time = event.time;
        let trigger = TRIGGER_REMOVE_LIQUIDITY;
        trigger_periodic_state(market_ref_mut, registry_ref_mut, time, trigger, tvl_start);

        // Store reserves at start of operation.
        let reserves_start = market_ref_mut.cpamm_real_reserves;

        // Transfer coins.
        let base_total = event.base_amount + event.pro_rata_base_donation_claim_amount;
        let quote_total = event.quote_amount + event.pro_rata_quote_donation_claim_amount;
        coin::transfer<Emojicoin>(&market_signer, provider_address, base_total);
        coin::transfer<AptosCoin>(&market_signer, provider_address, quote_total);

        // Burn coins by first withdrawing them from provider's coin store, to trigger event.
        let lp_coins = coin::withdraw<EmojicoinLP>(provider, event.lp_coin_amount);
        burn_lp_coins<Emojicoin, EmojicoinLP>(market_ref_mut.metadata.market_address, lp_coins);

        // Update market state.
        let reserves_ref_mut = &mut market_ref_mut.cpamm_real_reserves;
        let quote_reserves_ref_mut = &mut reserves_ref_mut.quote;
        let start_quote = *quote_reserves_ref_mut;
        let tvl_start = tvl_cpamm(start_quote);
        reserves_ref_mut.base = reserves_ref_mut.base - event.base_amount;
        *quote_reserves_ref_mut = start_quote - event.quote_amount;
        let lp_coin_supply = market_ref_mut.lp_coin_supply - (event.lp_coin_amount as u128);
        market_ref_mut.lp_coin_supply = lp_coin_supply;
        let tvl_end = tvl_cpamm(*quote_reserves_ref_mut);

        // Update global total quote locked, TVL.
        let global_stats_ref_mut = &mut registry_ref_mut.global_stats;
        let global_total_quote_locked_ref_mut = &mut global_stats_ref_mut.total_quote_locked;
        let global_total_value_locked_ref_mut = &mut global_stats_ref_mut.total_value_locked;
        let delta_tvl = tvl_start - tvl_end;
        aggregator_v2::try_sub(global_total_quote_locked_ref_mut, (event.quote_amount as u128));
        aggregator_v2::try_sub(global_total_value_locked_ref_mut, delta_tvl);

        // Get FDV, market cap, at start and end of operation, update global stats accordingly.
        let (fdv_start, market_cap_start, fdv_end, market_cap_end) =
            fdv_market_cap_start_end(reserves_start, *reserves_ref_mut, EMOJICOIN_SUPPLY);
        update_global_fdv_market_cap_for_liquidity_operation(
            fdv_start,
            market_cap_start,
            fdv_end,
            market_cap_end,
            global_stats_ref_mut,
        );

        // Emit liquidity provision event, follow up on periodic state trackers/market state.
        event::emit(event);
        liquidity_provision_operation_epilogue(
            tvl_end,
            fdv_end,
            market_cap_end,
            lp_coin_supply,
            reserves_ref_mut.quote,
            trigger,
            market_ref_mut,
        );
    }

    /// Adds all supplemental chat emojis to the registry if they haven't been added yet. Returns
    /// true if the supplemental chat emojis were added, false otherwise.
    inline fun ensure_supplemental_chat_emojis_initialized(
        registry_ref_mut: &mut Registry
    ): bool acquires Registry, RegistryAddress {
        let supplemental_chat_emojis_ref_mut = &mut registry_ref_mut.supplemental_chat_emojis;

        let supplemental_chat_emojis = hex_codes::get_supplemental_chat_emojis();
        let emoji_0 = *vector::borrow(&supplemental_chat_emojis, 0);
        if (table::contains(supplemental_chat_emojis_ref_mut, emoji_0)) {
            false
        } else {
            vector::for_each(supplemental_chat_emojis, |emoji| {
                table::add(supplemental_chat_emojis_ref_mut, emoji, 0);
            });
            true
        }
    }

    fun init_module(emojicoin_dot_fun: &signer) {
        let constructor_ref = object::create_named_object(emojicoin_dot_fun, REGISTRY_NAME);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        let registry_signer = object::generate_signer(&constructor_ref);
        let registry_address = object::address_from_constructor_ref(&constructor_ref);
        move_to(emojicoin_dot_fun, RegistryAddress { registry_address });
        let time = timestamp::now_microseconds();
        let registry = Registry {
            registry_address,
            sequence_info: ParallelizableSequenceInfo {
                // Set last bump time to a period boundary so that the first bump of global state
                // takes place the next period boundary.
                last_bump_time: last_period_boundary(time, PERIOD_1D),
                nonce: aggregator_v2::create_unbounded_aggregator(),
            },
            coin_symbol_emojis: table::new(),
            supplemental_chat_emojis: table::new(),
            markets_by_emoji_bytes: smart_table::new(),
            markets_by_market_id: smart_table::new(),
            extend_ref,
            global_stats: GlobalStats {
                cumulative_quote_volume: aggregator_v2::create_unbounded_aggregator<u128>(),
                total_quote_locked: aggregator_v2::create_unbounded_aggregator<u128>(),
                total_value_locked: aggregator_v2::create_unbounded_aggregator<u128>(),
                market_cap: aggregator_v2::create_unbounded_aggregator<u128>(),
                fully_diluted_value: aggregator_v2::create_unbounded_aggregator<u128>(),
                cumulative_integrator_fees: aggregator_v2::create_unbounded_aggregator<u128>(),
                cumulative_swaps: aggregator_v2::create_unbounded_aggregator<u64>(),
                cumulative_chat_messages: aggregator_v2::create_unbounded_aggregator<u64>(),
            },
        };
        aggregator_v2::try_add(&mut registry.sequence_info.nonce, 1);

        // Load supported coin symbol emojis into registry.
        let coin_symbol_emojis_ref_mut = &mut registry.coin_symbol_emojis;
        vector::for_each_ref(&hex_codes::get_coin_symbol_emojis(), |emoji_bytes_ref| {
            table::add(coin_symbol_emojis_ref_mut, *emoji_bytes_ref, 0);
        });

        move_to(&registry_signer, registry);

        // Emit global state.
        event::emit(GlobalState {
            emit_time: time,
            registry_nonce: aggregator_v2::create_snapshot(1),
            trigger: TRIGGER_PACKAGE_PUBLICATION,
            cumulative_quote_volume: aggregator_v2::create_snapshot(0),
            total_quote_locked: aggregator_v2::create_snapshot(0),
            total_value_locked: aggregator_v2::create_snapshot(0),
            market_cap: aggregator_v2::create_snapshot(0),
            fully_diluted_value: aggregator_v2::create_snapshot(0),
            cumulative_integrator_fees: aggregator_v2::create_snapshot(0),
            cumulative_swaps: aggregator_v2::create_snapshot(0),
            cumulative_chat_messages: aggregator_v2::create_snapshot(0),
        });
    }

    #[view]
    /// Checks if an individual emoji is supported as a coin symbol.
    public fun is_a_supported_symbol_emoji(
        hex_bytes: vector<u8>
    ): bool acquires Registry, RegistryAddress {
        table::contains(&borrow_registry_ref().coin_symbol_emojis, hex_bytes)
    }

    #[view]
    /// Checks if an individual emoji is supported for usage in chat only.
    public fun is_a_supplemental_chat_emoji(
        hex_bytes: vector<u8>
    ): bool acquires Registry, RegistryAddress {
        table::contains(&borrow_registry_ref().supplemental_chat_emojis, hex_bytes)
    }

    #[view]
    /// Checks if an individual emoji is supported for usage in chat.
    public fun is_a_supported_chat_emoji(
        hex_bytes: vector<u8>
    ): bool acquires Registry, RegistryAddress {
        is_a_supported_chat_emoji_inner(hex_bytes)
    }

    #[view]
    public fun registry_address(): address acquires RegistryAddress { get_registry_address() }

    #[view]
    public fun registry_view(): RegistryView acquires Registry, RegistryAddress {
        let registry_ref = borrow_registry_ref();
        RegistryView {
            registry_address: registry_ref.registry_address,
            nonce: aggregator_v2::snapshot(&registry_ref.sequence_info.nonce),
            last_bump_time: registry_ref.sequence_info.last_bump_time,
            n_markets: smart_table::length(&registry_ref.markets_by_market_id),
            cumulative_quote_volume:
                aggregator_v2::snapshot(&registry_ref.global_stats.cumulative_quote_volume),
            total_quote_locked:
                aggregator_v2::snapshot(&registry_ref.global_stats.total_quote_locked),
            total_value_locked:
                aggregator_v2::snapshot(&registry_ref.global_stats.total_value_locked),
            market_cap:
                aggregator_v2::snapshot(&registry_ref.global_stats.market_cap),
            fully_diluted_value:
                aggregator_v2::snapshot(&registry_ref.global_stats.fully_diluted_value),
            cumulative_integrator_fees:
                aggregator_v2::snapshot(&registry_ref.global_stats.cumulative_integrator_fees),
            cumulative_swaps:
                aggregator_v2::snapshot(&registry_ref.global_stats.cumulative_swaps),
            cumulative_chat_messages:
                aggregator_v2::snapshot(&registry_ref.global_stats.cumulative_chat_messages),
        }
    }

    #[view]
    public fun market_metadata_by_emoji_bytes(emoji_bytes: vector<u8>): Option<MarketMetadata>
    acquires Market, Registry, RegistryAddress {
        let registry_ref = borrow_registry_ref();
        let markets_by_emoji_bytes_ref = &registry_ref.markets_by_emoji_bytes;
        if (smart_table::contains(markets_by_emoji_bytes_ref, emoji_bytes)) {
            let market_address = *smart_table::borrow(markets_by_emoji_bytes_ref, emoji_bytes);
            option::some(borrow_global<Market>(market_address).metadata)
        } else {
            option::none()
        }
    }

    #[view]
    public fun market_metadata_by_market_address(market_address: address): Option<MarketMetadata>
    acquires Market {
        if (exists<Market>(market_address)) {
            option::some(borrow_global<Market>(market_address).metadata)
        } else {
            option::none()
        }
    }

    #[view]
    public fun market_metadata_by_market_id(market_id: u64): Option<MarketMetadata>
    acquires Market, Registry, RegistryAddress {
        let registry_ref = borrow_registry_ref();
        let markets_by_market_id_ref = &registry_ref.markets_by_market_id;
        if (smart_table::contains(markets_by_market_id_ref, market_id)) {
            let market_address = *smart_table::borrow(markets_by_market_id_ref, market_id);
            option::some(borrow_global<Market>(market_address).metadata)
        } else {
            option::none()
        }
    }

    #[view]
    public fun market_view<Emojicoin, EmojicoinLP>(market_address: address): MarketView
    acquires Market {
        let (market_ref, market_signer) = get_market_ref_and_signer_checked(market_address);
        ensure_coins_initialized<Emojicoin, EmojicoinLP>(
            market_ref,
            &market_signer,
            market_address,
        );
        let lp_coin_supply = market_ref.lp_coin_supply;
        let in_bonding_curve = lp_coin_supply == 0;
        MarketView {
            metadata: market_ref.metadata,
            sequence_info: market_ref.sequence_info,
            clamm_virtual_reserves: market_ref.clamm_virtual_reserves,
            cpamm_real_reserves: market_ref.cpamm_real_reserves,
            lp_coin_supply,
            in_bonding_curve,
            cumulative_stats: market_ref.cumulative_stats,
            instantaneous_stats: instantaneous_stats(market_ref),
            last_swap: market_ref.last_swap,
            periodic_state_trackers: market_ref.periodic_state_trackers,
            aptos_coin_balance: coin::balance<AptosCoin>(market_address),
            emojicoin_balance: coin::balance<Emojicoin>(market_address),
            emojicoin_lp_balance: coin::balance<EmojicoinLP>(market_address),
        }
    }

    #[view]
    public fun simulate_swap(
        swapper: address,
        market_address: address,
        input_amount: u64,
        is_sell: bool,
        integrator: address,
        integrator_fee_rate_bps: u8,
    ): Swap
    acquires Market {
        assert!(exists<Market>(market_address), E_NO_MARKET);
        simulate_swap_inner(
            swapper,
            input_amount,
            is_sell,
            integrator,
            integrator_fee_rate_bps,
            borrow_global(market_address),
        )
    }

    #[view]
    public fun simulate_provide_liquidity(
        provider: address,
        market_address: address,
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
        provider: address,
        market_address: address,
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

    #[view]
    public fun verified_symbol_emoji_bytes(emojis: vector<vector<u8>>): vector<u8>
    acquires Registry, RegistryAddress {
        get_verified_symbol_emoji_bytes(borrow_registry_ref(), emojis)
    }

    public fun tvl_per_lp_coin_growth_q64(
        start: TVLtoLPCoinRatio,
        end: TVLtoLPCoinRatio,
    ): u128 {
        tvl_per_lp_coin_growth_q64_inline(start, end)
    }

    public fun unpack_cumulative_stats(cumulative_stats: CumulativeStats): (
        u128,
        u128,
        u128,
        u128,
        u128,
        u64,
        u64,
    ) {
        let CumulativeStats {
            base_volume,
            quote_volume,
            integrator_fees,
            pool_fees_base,
            pool_fees_quote,
            n_swaps,
            n_chat_messages,
        } = cumulative_stats;
        (
            base_volume,
            quote_volume,
            integrator_fees,
            pool_fees_base,
            pool_fees_quote,
            n_swaps,
            n_chat_messages,
        )
    }

    public fun unpack_instantaneous_stats(instantaneous_stats: InstantaneousStats): (
        u64,
        u128,
        u128,
        u128,
    ) {
        let InstantaneousStats {
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
        } = instantaneous_stats;
        (total_quote_locked, total_value_locked, market_cap, fully_diluted_value)
    }

    public fun unpack_last_swap(last_swap: LastSwap): (
        bool,
        u128,
        u64,
        u64,
        u64,
        u64,
    ) {
        let LastSwap {
            is_sell,
            avg_execution_price_q64,
            base_volume,
            quote_volume,
            nonce,
            time,
        } = last_swap;
        (is_sell, avg_execution_price_q64, base_volume, quote_volume, nonce, time)
    }

    public fun unpack_liquidity(liquidity: Liquidity): (
        u64,
        u64,
        u64,
        address,
        u64,
        u64,
        u64,
        bool,
        u64,
        u64,
    ) {
        let Liquidity {
            market_id,
            time,
            market_nonce,
            provider,
            base_amount,
            quote_amount,
            lp_coin_amount,
            liquidity_provided,
            pro_rata_base_donation_claim_amount,
            pro_rata_quote_donation_claim_amount,
        } = liquidity;
        (
            market_id,
            time,
            market_nonce,
            provider,
            base_amount,
            quote_amount,
            lp_coin_amount,
            liquidity_provided,
            pro_rata_base_donation_claim_amount,
            pro_rata_quote_donation_claim_amount,
        )
    }

    public fun unpack_market_metadata(metadata: MarketMetadata): (
        u64,
        address,
        vector<u8>,
    ) {
        let MarketMetadata {
            market_id,
            market_address,
            emoji_bytes,
        } = metadata;
        (market_id, market_address, emoji_bytes)
    }

    public fun unpack_market_view(market_view: MarketView): (
        MarketMetadata,
        SequenceInfo,
        Reserves,
        Reserves,
        u128,
        bool,
        CumulativeStats,
        InstantaneousStats,
        LastSwap,
        vector<PeriodicStateTracker>,
        u64,
        u64,
        u64,
    ) {
        let MarketView {
            metadata,
            sequence_info,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            lp_coin_supply,
            in_bonding_curve,
            cumulative_stats,
            instantaneous_stats,
            last_swap,
            periodic_state_trackers,
            aptos_coin_balance,
            emojicoin_balance,
            emojicoin_lp_balance,
        } = market_view;
        (
            metadata,
            sequence_info,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            lp_coin_supply,
            in_bonding_curve,
            cumulative_stats,
            instantaneous_stats,
            last_swap,
            periodic_state_trackers,
            aptos_coin_balance,
            emojicoin_balance,
            emojicoin_lp_balance,
        )
    }

    public fun unpack_periodic_state_tracker(periodic_state_tracker: PeriodicStateTracker): (
        u64,
        u64,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u64,
        u64,
        bool,
        bool,
        TVLtoLPCoinRatio,
        TVLtoLPCoinRatio,
    ) {
        let PeriodicStateTracker {
            start_time,
            period,
            open_price_q64,
            high_price_q64,
            low_price_q64,
            close_price_q64,
            volume_base,
            volume_quote,
            integrator_fees,
            pool_fees_base,
            pool_fees_quote,
            n_swaps,
            n_chat_messages,
            starts_in_bonding_curve,
            ends_in_bonding_curve,
            tvl_to_lp_coin_ratio_start,
            tvl_to_lp_coin_ratio_end,
        } = periodic_state_tracker;
        (
            start_time,
            period,
            open_price_q64,
            high_price_q64,
            low_price_q64,
            close_price_q64,
            volume_base,
            volume_quote,
            integrator_fees,
            pool_fees_base,
            pool_fees_quote,
            n_swaps,
            n_chat_messages,
            starts_in_bonding_curve,
            ends_in_bonding_curve,
            tvl_to_lp_coin_ratio_start,
            tvl_to_lp_coin_ratio_end,
        )
    }

    public fun unpack_registry_view(registry_view: RegistryView): (
        address,
        AggregatorSnapshot<u64>,
        u64,
        u64,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u64>,
        AggregatorSnapshot<u64>,
    ) {
        let RegistryView {
            registry_address,
            nonce,
            last_bump_time,
            n_markets,
            cumulative_quote_volume,
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
            cumulative_integrator_fees,
            cumulative_swaps,
            cumulative_chat_messages,
        } = registry_view;
        (
            registry_address,
            nonce,
            last_bump_time,
            n_markets,
            cumulative_quote_volume,
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
            cumulative_integrator_fees,
            cumulative_swaps,
            cumulative_chat_messages,
        )
    }

    public fun unpack_reserves(reserves: Reserves): (u64, u64) {
        let Reserves { base, quote } = reserves;
        (base, quote)
    }

    public fun unpack_swap(swap: Swap): (
        u64,
        u64,
        u64,
        address,
        u64,
        bool,
        address,
        u8,
        u64,
        u64,
        u64,
        u128,
        u64,
        u64,
        bool,
        bool,
    ) {
        let Swap {
            market_id,
            time,
            market_nonce,
            swapper,
            input_amount,
            is_sell,
            integrator,
            integrator_fee_rate_bps,
            net_proceeds,
            base_volume,
            quote_volume,
            avg_execution_price_q64,
            integrator_fee,
            pool_fee,
            starts_in_bonding_curve,
            results_in_state_transition,
        } = swap;
        (
            market_id,
            time,
            market_nonce,
            swapper,
            input_amount,
            is_sell,
            integrator,
            integrator_fee_rate_bps,
            net_proceeds,
            base_volume,
            quote_volume,
            avg_execution_price_q64,
            integrator_fee,
            pool_fee,
            starts_in_bonding_curve,
            results_in_state_transition,
        )
    }

    public fun unpack_sequence_info(sequence_info: SequenceInfo): (u64, u64) {
        let SequenceInfo { nonce, last_bump_time } = sequence_info;
        (nonce, last_bump_time)
    }

    public fun unpack_tvl_to_lp_coin_ratio(tvl_to_lp_coin_ratio: TVLtoLPCoinRatio): (u128, u128) {
        let TVLtoLPCoinRatio { tvl, lp_coins } = tvl_to_lp_coin_ratio;
        (tvl, lp_coins)
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

    /*inline*/ fun burn_lp_coins<Emojicoin, EmojicoinLP>(
        market_address: address,
        coin: Coin<EmojicoinLP>,
    ) acquires LPCoinCapabilities {
        let coin_caps = borrow_global<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address);
        coin::burn<EmojicoinLP>(coin, &coin_caps.burn);
    }

    // Ideally this would be inline, but unfortunately that breaks the compiler.
    fun trigger_periodic_state(
        market_ref_mut: &mut Market,
        registry_ref_mut: &mut Registry,
        time: u64,
        trigger: u8,
        tvl: u128,
    ) {
        // Update market sequence info.
        let market_sequence_info_ref_mut = &mut market_ref_mut.sequence_info;
        let nonce = market_sequence_info_ref_mut.nonce + 1;
        market_sequence_info_ref_mut.nonce = nonce;
        market_sequence_info_ref_mut.last_bump_time = time;

        // Check periodic state tracker period lapses.
        let lp_coin_supply = market_ref_mut.lp_coin_supply;
        let in_bonding_curve = lp_coin_supply == 0;
        vector::for_each_mut(&mut market_ref_mut.periodic_state_trackers, |e| {
            // Type declaration per https://github.com/aptos-labs/aptos-core/issues/9508.
            let tracker_ref_mut: &mut PeriodicStateTracker = e;
            let period = tracker_ref_mut.period;
            // If tracker period has lapsed, emit a periodic state event and reset the tracker.
            if (time - tracker_ref_mut.start_time >= period) {
                emit_periodic_state(
                    &market_ref_mut.metadata,
                    nonce,
                    time,
                    trigger,
                    tracker_ref_mut,
                );
                tracker_ref_mut.start_time = last_period_boundary(time, period);
                tracker_ref_mut.open_price_q64 = 0;
                tracker_ref_mut.high_price_q64 = 0;
                tracker_ref_mut.low_price_q64 = 0;
                tracker_ref_mut.close_price_q64 = 0;
                tracker_ref_mut.volume_base = 0;
                tracker_ref_mut.volume_quote = 0;
                tracker_ref_mut.integrator_fees = 0;
                tracker_ref_mut.pool_fees_base = 0;
                tracker_ref_mut.pool_fees_quote = 0;
                tracker_ref_mut.n_swaps = 0;
                tracker_ref_mut.n_chat_messages = 0;
                tracker_ref_mut.starts_in_bonding_curve = in_bonding_curve;
                tracker_ref_mut.ends_in_bonding_curve = in_bonding_curve;
                tracker_ref_mut.tvl_to_lp_coin_ratio_start.tvl = tvl;
                tracker_ref_mut.tvl_to_lp_coin_ratio_start.lp_coins = lp_coin_supply;
                tracker_ref_mut.tvl_to_lp_coin_ratio_end.tvl = tvl;
                tracker_ref_mut.tvl_to_lp_coin_ratio_end.lp_coins = lp_coin_supply;
            };
        });

        // Increment registry nonce.
        let registry_sequence_info_ref_mut = &mut registry_ref_mut.sequence_info;
        let registry_nonce_ref_mut = &mut registry_sequence_info_ref_mut.nonce;
        aggregator_v2::try_add(registry_nonce_ref_mut, 1);

        // Check global state tracker period lapse.
        let last_registry_bump_time = registry_sequence_info_ref_mut.last_bump_time;
        if (time - last_registry_bump_time >= PERIOD_1D) {
            registry_sequence_info_ref_mut.last_bump_time = time;
            let global_stats_ref = &registry_ref_mut.global_stats;
            event::emit(GlobalState {
                emit_time: time,
                registry_nonce: aggregator_v2::snapshot(registry_nonce_ref_mut),
                trigger,
                cumulative_quote_volume:
                    aggregator_v2::snapshot(&global_stats_ref.cumulative_quote_volume),
                total_quote_locked:
                    aggregator_v2::snapshot(&global_stats_ref.total_quote_locked),
                total_value_locked:
                    aggregator_v2::snapshot(&global_stats_ref.total_value_locked),
                market_cap:
                    aggregator_v2::snapshot(&global_stats_ref.market_cap),
                fully_diluted_value:
                    aggregator_v2::snapshot(&global_stats_ref.fully_diluted_value),
                cumulative_integrator_fees:
                    aggregator_v2::snapshot(&global_stats_ref.cumulative_integrator_fees),
                cumulative_swaps:
                    aggregator_v2::snapshot(&global_stats_ref.cumulative_swaps),
                cumulative_chat_messages:
                    aggregator_v2::snapshot(&global_stats_ref.cumulative_chat_messages),
            });
        };
    }

    /*inline*/ fun bump_market_state(
        market_ref: &Market,
        trigger: u8,
        instantaneous_stats: InstantaneousStats,
    ) {
        let sequence_info_ref = &market_ref.sequence_info;
        event::emit(State {
            market_metadata: market_ref.metadata,
            state_metadata: StateMetadata {
                market_nonce: sequence_info_ref.nonce,
                bump_time: sequence_info_ref.last_bump_time,
                trigger,
            },
            clamm_virtual_reserves: market_ref.clamm_virtual_reserves,
            cpamm_real_reserves: market_ref.cpamm_real_reserves,
            lp_coin_supply: market_ref.lp_coin_supply,
            cumulative_stats: market_ref.cumulative_stats,
            instantaneous_stats,
            last_swap: market_ref.last_swap,
        });
    }

    /*inline*/ fun emit_periodic_state(
        market_metadata_ref: &MarketMetadata,
        nonce: u64,
        time: u64,
        trigger: u8,
        tracker_ref: &PeriodicStateTracker,
    ) {
        event::emit(PeriodicState {
            market_metadata: *market_metadata_ref,
            periodic_state_metadata: PeriodicStateMetadata {
                start_time: tracker_ref.start_time,
                emit_time: time,
                emit_market_nonce: nonce,
                period: tracker_ref.period,
                trigger,
            },
            open_price_q64: tracker_ref.open_price_q64,
            high_price_q64: tracker_ref.high_price_q64,
            low_price_q64: tracker_ref.low_price_q64,
            close_price_q64: tracker_ref.close_price_q64,
            volume_base: tracker_ref.volume_base,
            volume_quote: tracker_ref.volume_quote,
            integrator_fees: tracker_ref.integrator_fees,
            pool_fees_base: tracker_ref.pool_fees_base,
            pool_fees_quote: tracker_ref.pool_fees_quote,
            n_swaps: tracker_ref.n_swaps,
            n_chat_messages: tracker_ref.n_chat_messages,
            starts_in_bonding_curve: tracker_ref.starts_in_bonding_curve,
            ends_in_bonding_curve: tracker_ref.ends_in_bonding_curve,
            tvl_per_lp_coin_growth_q64: tvl_per_lp_coin_growth_q64_inline(
                tracker_ref.tvl_to_lp_coin_ratio_start,
                tracker_ref.tvl_to_lp_coin_ratio_end,
            ),
        });
    }

    /*inline*/ fun last_period_boundary(
        time: u64,
        period: u64,
    ): u64 {
        (time / period) * period
    }

    /*inline*/ fun mint_lp_coins<Emojicoin, EmojicoinLP>(
        market_address: address,
        amount: u64,
    ): Coin<EmojicoinLP> acquires LPCoinCapabilities {
        let coin_caps = borrow_global<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address);
        coin::mint<EmojicoinLP>(amount, &coin_caps.mint)
    }

    // Ideally this would be inline, but unfortunately that breaks the compiler.
    fun simulate_swap_inner(
        swapper: address,
        input_amount: u64,
        is_sell: bool,
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
        if (is_sell) { // If selling, no possibility of state transition.
            let amm_quote_output;
            if (starts_in_bonding_curve) { // Selling to CLAMM only.
                amm_quote_output = cpamm_simple_swap_output_amount(
                    input_amount,
                    is_sell,
                    market_ref.clamm_virtual_reserves,
                );
            } else { // Selling to CPAMM only.
                amm_quote_output = cpamm_simple_swap_output_amount(
                    input_amount,
                    is_sell,
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
                        is_sell,
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
                            is_sell,
                            Reserves { base: EMOJICOIN_REMAINDER, quote: QUOTE_REAL_CEILING },
                        );
                        pool_fee = get_bps_fee(cpamm_base_output, POOL_FEE_RATE_BPS);
                        base_volume = base_volume + cpamm_base_output - pool_fee;
                    };
                };
            } else { // Buying from CPAMM only.
                let cpamm_base_output = cpamm_simple_swap_output_amount(
                    quote_volume,
                    is_sell,
                    market_ref.cpamm_real_reserves,
                );
                pool_fee = get_bps_fee(cpamm_base_output, POOL_FEE_RATE_BPS);
                base_volume = cpamm_base_output - pool_fee;
            };
            net_proceeds = base_volume;
        };
        Swap {
            market_id: market_ref.metadata.market_id,
            time: timestamp::now_microseconds(),
            market_nonce: market_ref.sequence_info.nonce + 1,
            swapper,
            input_amount,
            is_sell,
            integrator,
            integrator_fee_rate_bps,
            net_proceeds,
            base_volume,
            quote_volume,
            // Ideally this would be inline, but that strangely breaks the compiler.
            avg_execution_price_q64: ((quote_volume as u128) << SHIFT_Q64) / (base_volume as u128),
            integrator_fee,
            pool_fee,
            starts_in_bonding_curve,
            results_in_state_transition,
        }
    }

    /*inline*/ fun simulate_provide_liquidity_inner(
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
        let base_amount_numerator = (base_reserves_u128 * quote_amount_u128);
        let base_amount_denominator = quote_reserves_u128;

        // Have LP assume the effects of truncation by rounding up to nearest base subunit.
        let remainder = base_amount_numerator % base_amount_denominator;
        let round_if_needed = 1 - ((remainder ^ HI_128) / HI_128);
        let base_amount_u128 = (base_amount_numerator / base_amount_denominator) + round_if_needed;

        // Proportional LP coins to mint: (quote_amount / quote_reserves) * (lp_coin_supply).
        let lp_coin_amount_u128 =
            (quote_amount_u128 * market_ref.lp_coin_supply) / quote_reserves_u128;

        Liquidity {
            market_id: market_ref.metadata.market_id,
            time: timestamp::now_microseconds(),
            market_nonce: market_ref.sequence_info.nonce + 1,
            provider,
            base_amount: (base_amount_u128 as u64),
            quote_amount,
            lp_coin_amount: (lp_coin_amount_u128 as u64),
            liquidity_provided: true,
            pro_rata_base_donation_claim_amount: 0,
            pro_rata_quote_donation_claim_amount: 0,
        }
    }

    /*inline*/ fun simulate_remove_liquidity_inner<Emojicoin>(
        provider: address,
        lp_coin_amount: u64,
        market_ref: &Market,
    ): Liquidity {
        let lp_coin_supply = market_ref.lp_coin_supply;
        let lp_coin_amount_u128 = (lp_coin_amount as u128);

        assert!(lp_coin_supply > 0, E_STILL_IN_BONDING_CURVE);
        assert!(lp_coin_amount > 0, E_LIQUIDITY_NO_LP_COINS);

        let reserves_ref = market_ref.cpamm_real_reserves;
        let base_reserves_u128 = (reserves_ref.base as u128);
        let quote_reserves_u128 = (reserves_ref.quote as u128);

        // Proportional base amount: (lp_coin_amount / lp_coin_supply) * (base_reserves).
        let base_amount = ((lp_coin_amount_u128 * base_reserves_u128 / lp_coin_supply) as u64);

        // Proportional quote amount: (lp_coin_amount / lp_coin_supply) * (quote_reserves).
        let quote_amount = ((lp_coin_amount_u128 * quote_reserves_u128 / lp_coin_supply) as u64);

        // Check to see if base or quote donations have been sent to market coin stores.
        let market_address = market_ref.metadata.market_address;
        let market_balance_base_u128 = (coin::balance<Emojicoin>(market_address) as u128);
        let market_balance_quote_u128 = (coin::balance<AptosCoin>(market_address) as u128);
        let base_donations_u128 = market_balance_base_u128 - base_reserves_u128;
        let quote_donations_u128 = market_balance_quote_u128 - quote_reserves_u128;
        let pro_rata_base_donation_claim_amount =
            (((lp_coin_amount_u128 * base_donations_u128) / lp_coin_supply) as u64);
        let pro_rata_quote_donation_claim_amount =
            (((lp_coin_amount_u128 * quote_donations_u128) / lp_coin_supply) as u64);

        Liquidity {
            market_id: market_ref.metadata.market_id,
            time: timestamp::now_microseconds(),
            market_nonce: market_ref.sequence_info.nonce + 1,
            provider,
            base_amount,
            quote_amount,
            lp_coin_amount,
            liquidity_provided: false,
            pro_rata_base_donation_claim_amount,
            pro_rata_quote_donation_claim_amount,
        }
    }

    /*inline*/ fun get_bps_fee(
        principal: u64,
        fee_rate_bps: u8,
    ): u64 {
        ((((principal as u128) * (fee_rate_bps as u128)) / BASIS_POINTS_PER_UNIT) as u64)
    }

    /*inline*/ fun cpamm_simple_swap_output_amount(
        input_amount: u64,
        is_sell: bool,
        reserves: Reserves
    ): u64 {
        let (numerator_coefficient, denominator_addend) = if (is_sell)
            (reserves.quote, reserves.base) else (reserves.base, reserves.quote);
        let numerator = (input_amount as u128) * (numerator_coefficient as u128);
        let denominator = (input_amount as u128) + (denominator_addend as u128);
        assert!(denominator > 0, E_SWAP_DIVIDE_BY_ZERO);
        let result = numerator / denominator;
        (result as u64)
    }

    /*inline*/ fun total_quote_locked(
        market_ref: &Market,
        in_bonding_curve: bool,
    ): u64 {
        if (in_bonding_curve) {
            market_ref.clamm_virtual_reserves.quote - QUOTE_VIRTUAL_FLOOR
        } else {
            market_ref.cpamm_real_reserves.quote
        }
    }

    /*inline*/ fun tvl(
        market_ref: &Market,
        in_bonding_curve: bool,
    ): u128 {
        if (in_bonding_curve) {
            tvl_clamm(market_ref.clamm_virtual_reserves)
        } else {
            tvl_cpamm(market_ref.cpamm_real_reserves.quote)
        }
    }

    /*inline*/ fun tvl_clamm(
        virtual_reserves: Reserves,
    ): u128 {
        let quote_virtual = virtual_reserves.quote;
        let quote_real = quote_virtual - QUOTE_VIRTUAL_FLOOR;
        if (quote_real == 0) { // Report no TVL if no one has bought into bonding curve.
            0
        } else {
            let base_virtual = virtual_reserves.base;
            // Determine total amount of all base still locked in the market.
            let base_real = base_virtual - BASE_VIRTUAL_FLOOR + EMOJICOIN_REMAINDER;
            // Convert to an effective quote value via multiplying by spot price.
            let base_real_denominated_in_quote = mul_div(quote_virtual, base_real, base_virtual);
            (quote_real as u128) + base_real_denominated_in_quote
        }
    }

    /*inline*/ fun tvl_cpamm(
        real_quote_reserves: u64,
    ): u128 {
        // Base reserves priced in quote are equal to the value of quote reserves.
        2 * (real_quote_reserves as u128)
    }

    /// `a :=` TVL at start
    /// `b :=` LP coins at start
    /// `c :=` TVL at end
    /// `d :=` LP coins at end
    ///
    /// Growth in TVL per LP coin symbolically evaluates to:
    /// `(c / d) / (a / b)`
    /// `(b * c) / (a * d)`
    ///
    /// Numerator should be shifted by `SHIFT_Q64` so that the result is in Q64 format.
    ///
    /// While all terms can technically be `u128`, in practice they will all be `u64`, and even if
    /// a few terms require a few extra bits, there should not be any overflow.
    /*inline*/ fun tvl_per_lp_coin_growth_q64_inline(
        start: TVLtoLPCoinRatio,
        end: TVLtoLPCoinRatio,
    ): u128 {
        let a = start.tvl;
        let b = start.lp_coins;
        let c = end.tvl;
        let d = end.lp_coins;
        if (a == 0 || d == 0) {
            0
        } else {
            let numerator = (b as u256) * (c as u256);
            let denominator = (a as u256) * (d as u256);
            (((numerator << SHIFT_Q64) / denominator) as u128)
        }
    }

    /*inline*/ fun liquidity_provision_operation_epilogue(
        tvl: u128,
        fdv: u128,
        market_cap: u128,
        lp_coin_supply: u128,
        total_quote_locked: u64,
        trigger: u8,
        market_ref_mut: &mut Market,
    ) {
        // Update periodic state trackers.
        vector::for_each_mut(&mut market_ref_mut.periodic_state_trackers, |e| {
            // Type declaration per https://github.com/aptos-labs/aptos-core/issues/9508.
            let tracker_ref_mut: &mut PeriodicStateTracker = e;
            tracker_ref_mut.tvl_to_lp_coin_ratio_end.tvl = tvl;
            tracker_ref_mut.tvl_to_lp_coin_ratio_end.lp_coins = lp_coin_supply;
            tracker_ref_mut.ends_in_bonding_curve = false;
        });

        // Get instantaneous stats, bump market state.
        bump_market_state(
            market_ref_mut,
            trigger,
            InstantaneousStats {
                total_quote_locked,
                total_value_locked: tvl,
                market_cap: market_cap,
                fully_diluted_value: fdv,
            },
        );
    }

    /*inline*/ fun update_global_fdv_market_cap_for_liquidity_operation(
        fdv_start: u128,
        market_cap_start: u128,
        fdv_end: u128,
        market_cap_end: u128,
        global_stats_ref_mut: &mut GlobalStats
    ) {
        // Declare fields to update.
        let global_fdv_ref_mut = &mut global_stats_ref_mut.fully_diluted_value;
        let global_market_cap_ref_mut = &mut global_stats_ref_mut.market_cap;

        // Although FDV and market cap shouldn't change in a theoretical sense during a liquidity
        // provision or removal operation (since circulating supply and price haven't changed),
        // their numeric values may deviate slightly due to integer truncation (since price is a
        // result of CPAMM reserve amounts). Hence the global values must be updated to prevent the
        // accumulation of rounding errors.
        if (fdv_end > fdv_start) {
            aggregator_v2::try_add(global_fdv_ref_mut, fdv_end - fdv_start);
        } else {
            aggregator_v2::try_sub(global_fdv_ref_mut, fdv_start - fdv_end);
        };
        if (market_cap_end > market_cap_start) {
            aggregator_v2::try_add(global_market_cap_ref_mut, market_cap_end - market_cap_start);
        } else {
            aggregator_v2::try_sub(global_market_cap_ref_mut, market_cap_start - market_cap_end);
        };
    }

    #[test_only] const MICROSECONDS_PER_SECOND: u64 = 1_000_000;

    #[test_only] public fun assert_valid_coin_types_test_only<Emojicoin, EmojicoinLP>(
        market_address: address,
    ) {
        assert_valid_coin_types<Emojicoin, EmojicoinLP>(market_address)
    }

    #[test_only] public fun cpamm_simple_swap_output_amount_test_only(
        input_amount: u64,
        is_sell: bool,
        reserves: Reserves,
    ): u64 {
        cpamm_simple_swap_output_amount(input_amount, is_sell, reserves)
    }

    #[test_only] public fun exists_lp_coin_capabilities<Emojicoin, EmojicoinLP>(
        market_address: address,
    ): bool {
        exists<LPCoinCapabilities<Emojicoin, EmojicoinLP>>(market_address)
    }

    #[test_only] public fun fdv_market_cap_test_only(
        reserves: Reserves,
        supply_minuend: u64,
    ): (u128, u128) {
        fdv_market_cap(reserves, supply_minuend)
    }

    #[test_only] public fun get_bps_fee_test_only(
        principal: u64,
        fee_rate_bps: u8,
    ): u64 {
        get_bps_fee(principal, fee_rate_bps)
    }

    #[test_only] public fun get_concatenation_test_only(
        base: String,
        additional: String,
    ): String {
        get_concatenation(base, additional)
    }

    #[test_only] public fun get_BASE_REAL_CEILING(): u64 { BASE_REAL_CEILING }
    #[test_only] public fun get_BASE_VIRTUAL_CEILING(): u64 { BASE_VIRTUAL_CEILING }
    #[test_only] public fun get_BASE_VIRTUAL_FLOOR(): u64 { BASE_VIRTUAL_FLOOR }
    #[test_only] public fun get_BASIS_POINTS_PER_UNIT(): u128 { BASIS_POINTS_PER_UNIT }
    #[test_only] public fun get_COIN_FACTORY_AS_BYTES(): vector<u8> { COIN_FACTORY_AS_BYTES }
    #[test_only] public fun get_EMOJICOIN_STRUCT_NAME(): vector<u8> { EMOJICOIN_STRUCT_NAME }
    #[test_only] public fun get_EMOJICOIN_LP_NAME_SUFFIX(): vector<u8> { EMOJICOIN_LP_NAME_SUFFIX }
    #[test_only] public fun get_EMOJICOIN_LP_STRUCT_NAME(): vector<u8> { EMOJICOIN_LP_STRUCT_NAME }
    #[test_only] public fun get_EMOJICOIN_LP_SYMBOL_PREFIX(): vector<u8> {
        EMOJICOIN_LP_SYMBOL_PREFIX
    }
    #[test_only] public fun get_EMOJICOIN_LP_NAME(): vector<u8> {
        EMOJICOIN_LP_NAME_SUFFIX
    }
    #[test_only] public fun get_EMOJICOIN_NAME_SUFFIX(): vector<u8> { EMOJICOIN_NAME_SUFFIX }
    #[test_only] public fun get_EMOJICOIN_REMAINDER(): u64 { EMOJICOIN_REMAINDER }
    #[test_only] public fun get_EMOJICOIN_SUPPLY(): u64 { EMOJICOIN_SUPPLY }
    #[test_only] public fun get_LP_TOKENS_INITIAL(): u64 { LP_TOKENS_INITIAL }
    #[test_only] public fun get_MAX_CHAT_MESSAGE_LENGTH(): u64 { MAX_CHAT_MESSAGE_LENGTH }
    #[test_only] public fun get_MAX_SYMBOL_LENGTH(): u8 { MAX_SYMBOL_LENGTH }
    #[test_only] public fun get_MARKET_REGISTRATION_FEE(): u64 { MARKET_REGISTRATION_FEE }
    #[test_only] public fun get_MICROSECONDS_PER_SECOND(): u64 { MICROSECONDS_PER_SECOND }
    #[test_only] public fun get_PERIOD_1M(): u64 { PERIOD_1M }
    #[test_only] public fun get_PERIOD_5M(): u64 { PERIOD_5M }
    #[test_only] public fun get_PERIOD_15M(): u64 { PERIOD_15M }
    #[test_only] public fun get_PERIOD_30M(): u64 { PERIOD_30M }
    #[test_only] public fun get_PERIOD_1H(): u64 { PERIOD_1H }
    #[test_only] public fun get_PERIOD_4H(): u64 { PERIOD_4H }
    #[test_only] public fun get_PERIOD_1D(): u64 { PERIOD_1D }
    #[test_only] public fun get_POOL_FEE_RATE_BPS(): u8 { POOL_FEE_RATE_BPS }
    #[test_only] public fun get_REGISTRY_NAME(): vector<u8> { REGISTRY_NAME }
    #[test_only] public fun get_TRIGGER_CHAT(): u8 { TRIGGER_CHAT }
    #[test_only] public fun get_TRIGGER_MARKET_REGISTRATION(): u8 { TRIGGER_MARKET_REGISTRATION }
    #[test_only] public fun get_TRIGGER_PACKAGE_PUBLICATION(): u8 { TRIGGER_PACKAGE_PUBLICATION }
    #[test_only] public fun get_TRIGGER_PROVIDE_LIQUIDITY(): u8 { TRIGGER_PROVIDE_LIQUIDITY }
    #[test_only] public fun get_TRIGGER_REMOVE_LIQUIDITY(): u8 { TRIGGER_REMOVE_LIQUIDITY }
    #[test_only] public fun get_TRIGGER_SWAP_BUY(): u8 { TRIGGER_SWAP_BUY }
    #[test_only] public fun get_TRIGGER_SWAP_SELL(): u8 { TRIGGER_SWAP_SELL }
    #[test_only] public fun get_QUOTE_REAL_CEILING(): u64 { QUOTE_REAL_CEILING }
    #[test_only] public fun get_QUOTE_VIRTUAL_CEILING(): u64 { QUOTE_VIRTUAL_CEILING }
    #[test_only] public fun get_QUOTE_VIRTUAL_FLOOR(): u64 { QUOTE_VIRTUAL_FLOOR }

    #[test_only] public fun init_module_test_only(account: &signer) { init_module(account) }

    #[test_only] public fun pack_reserves(base: u64, quote: u64): Reserves {
        Reserves { base, quote }
    }

    #[test_only] public fun register_market_without_publish(
        registrant: &signer,
        emojis: vector<vector<u8>>,
        integrator: address,
    ) acquires Market, Registry, RegistryAddress {
        register_market_inner(registrant, emojis, integrator, false);
    }

    #[test_only] public fun tvl_clamm_test_only(virtual_reserves: Reserves): u128 {
        tvl_clamm(virtual_reserves)
    }

    #[test_only] public fun unpack_chat(
        chat: Chat,
    ): (
        MarketMetadata,
        u64,
        u64,
        address,
        String,
        u64,
        u64,
        u128,
    ) {
        let Chat {
            market_metadata,
            emit_time,
            emit_market_nonce,
            user,
            message,
            user_emojicoin_balance,
            circulating_supply,
            balance_as_fraction_of_circulating_supply_q64,
        } = chat;
        (
            market_metadata,
            emit_time,
            emit_market_nonce,
            user,
            message,
            user_emojicoin_balance,
            circulating_supply,
            balance_as_fraction_of_circulating_supply_q64,
        )
    }

    #[test_only] public fun unpack_global_state(
        global_state: GlobalState,
    ): (
        u64,
        AggregatorSnapshot<u64>,
        u8,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u128>,
        AggregatorSnapshot<u64>,
        AggregatorSnapshot<u64>,
    ) {
        let GlobalState {
            emit_time,
            registry_nonce,
            trigger,
            cumulative_quote_volume,
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
            cumulative_integrator_fees,
            cumulative_swaps,
            cumulative_chat_messages,
        } = global_state;
        (
            emit_time,
            registry_nonce,
            trigger,
            cumulative_quote_volume,
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
            cumulative_integrator_fees,
            cumulative_swaps,
            cumulative_chat_messages,
        )
    }

    #[test_only] public fun unpack_market_registration(
        market_registration: MarketRegistration,
    ): (
        MarketMetadata,
        u64,
        address,
        address,
        u64,
    ) {
        let MarketRegistration {
            market_metadata,
            time,
            registrant,
            integrator,
            integrator_fee,
        } = market_registration;
        (market_metadata, time, registrant, integrator, integrator_fee)
    }

    #[test_only] public fun unpack_periodic_state(
        periodic_state: PeriodicState,
    ): (
        MarketMetadata,
        PeriodicStateMetadata,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u128,
        u64,
        u64,
        bool,
        bool,
        u128,
    ) {
        let PeriodicState {
            market_metadata,
            periodic_state_metadata,
            open_price_q64,
            high_price_q64,
            low_price_q64,
            close_price_q64,
            volume_base,
            volume_quote,
            integrator_fees,
            pool_fees_base,
            pool_fees_quote,
            n_swaps,
            n_chat_messages,
            starts_in_bonding_curve,
            ends_in_bonding_curve,
            tvl_per_lp_coin_growth_q64,
        } = periodic_state;
        (
            market_metadata,
            periodic_state_metadata,
            open_price_q64,
            high_price_q64,
            low_price_q64,
            close_price_q64,
            volume_base,
            volume_quote,
            integrator_fees,
            pool_fees_base,
            pool_fees_quote,
            n_swaps,
            n_chat_messages,
            starts_in_bonding_curve,
            ends_in_bonding_curve,
            tvl_per_lp_coin_growth_q64,
        )
    }

    #[test_only] public fun unpack_periodic_state_metadata(
        periodic_state_metadata: PeriodicStateMetadata,
    ): (
        u64,
        u64,
        u64,
        u64,
        u8,
    ) {
        let PeriodicStateMetadata {
            start_time,
            emit_time,
            emit_market_nonce,
            period,
            trigger,
        } = periodic_state_metadata;
        (
            start_time,
            emit_time,
            emit_market_nonce,
            period,
            trigger,
        )
    }

    #[test_only] public fun unpack_state(
        state: State,
    ): (
        MarketMetadata,
        StateMetadata,
        Reserves,
        Reserves,
        u128,
        CumulativeStats,
        InstantaneousStats,
        LastSwap,
    ) {
        let State {
            market_metadata,
            state_metadata,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            lp_coin_supply,
            cumulative_stats,
            instantaneous_stats,
            last_swap,
        } = state;
        (
            market_metadata,
            state_metadata,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            lp_coin_supply,
            cumulative_stats,
            instantaneous_stats,
            last_swap,
        )
    }

    #[test_only] public fun unpack_state_metadata(
        state_metadata: StateMetadata,
    ): (
        u64,
        u64,
        u8,
    ) {
        let StateMetadata {
            market_nonce,
            bump_time,
            trigger,
        } = state_metadata;
        (
            market_nonce,
            bump_time,
            trigger,
        )
    }

    #[test_only] public fun valid_coin_types_test_only<Emojicoin, EmojicoinLP>(
        market_address: address,
    ): bool {
        valid_coin_types<Emojicoin, EmojicoinLP>(market_address)
    }

}
