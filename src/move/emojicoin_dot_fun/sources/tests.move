// This module contains assorted mock structs used to canonicalize variable naming during state
// assertions, since the mocked structs themselves cannot be packed in this module (structs can
// only be packed inside the module that defines them). Mock struct names begin with `Mock`.
//
// Mock structs contain an associated test function for asserting that their fields match those of
// the corresponding struct defined in the main file. These test functions begin with `assert_`.
//
// Base struct values are defined via functions starting with `base_`, corresponding to default
// values that require the minimum number of field modifications for testing.
//
// For some testing cases that are reused across multiple tests, there are additional base struct
// functions: see constants starting with `SIMPLE_BUY_` and `EXACT_TRANSITION_` for more. These two
// sets of constants are tested individually via `swap_setup_case_test_flow()`, and are then used to
// fixture assorted tests that call on `swap_general_case_test_flow()`.
//
// cspell:word EINSUFFICIENT_BALANCE
#[test_only] module emojicoin_dot_fun::tests {

    use aptos_framework::account::{create_signer_for_test as get_signer};
    use aptos_framework::aggregator_v2::read_snapshot;
    use aptos_framework::aptos_account;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin;
    use aptos_framework::event::{emitted_events};
    use aptos_framework::object;
    use aptos_framework::timestamp;
    use aptos_std::string_utils;
    use black_cat_market::coin_factory::{
        Emojicoin as BlackCatEmojicoin,
        EmojicoinLP as BlackCatEmojicoinLP,
    };
    use black_heart_market::coin_factory::{
        Emojicoin as BlackHeartEmojicoin,
        EmojicoinLP as BlackHeartEmojicoinLP,
    };
    use coin_factory::coin_factory::{
        Emojicoin as CoinFactoryEmojicoin,
        EmojicoinLP as CoinFactoryEmojicoinLP,
    };
    use emojicoin_dot_fun::emojicoin_dot_fun::{
        Self,
        Chat,
        CumulativeStats,
        GlobalState,
        InstantaneousStats,
        LastSwap,
        MarketMetadata,
        MarketRegistration,
        MarketView,
        PeriodicState,
        PeriodicStateMetadata,
        PeriodicStateTracker,
        RegistryView,
        TVLtoLPCoinRatio,
        Reserves,
        SequenceInfo,
        State,
        StateMetadata,
        Swap,
        assert_valid_coin_types_test_only as assert_valid_coin_types,
        chat,
        cpamm_simple_swap_output_amount_test_only as cpamm_simple_swap_output_amount,
        exists_lp_coin_capabilities,
        fdv_market_cap_test_only as fdv_market_cap,
        get_BASE_REAL_CEILING,
        get_BASE_VIRTUAL_CEILING,
        get_BASE_VIRTUAL_FLOOR,
        get_BASIS_POINTS_PER_UNIT,
        get_COIN_FACTORY_AS_BYTES,
        get_EMOJICOIN_STRUCT_NAME,
        get_EMOJICOIN_LP_NAME_SUFFIX,
        get_EMOJICOIN_LP_STRUCT_NAME,
        get_EMOJICOIN_LP_SYMBOL_PREFIX,
        get_EMOJICOIN_NAME_SUFFIX,
        get_EMOJICOIN_REMAINDER,
        get_EMOJICOIN_SUPPLY,
        get_LP_TOKENS_INITIAL,
        get_MAX_CHAT_MESSAGE_LENGTH,
        get_MAX_SYMBOL_LENGTH,
        get_MARKET_REGISTRATION_FEE,
        get_MICROSECONDS_PER_SECOND,
        get_PERIOD_1M,
        get_PERIOD_5M,
        get_PERIOD_15M,
        get_PERIOD_30M,
        get_PERIOD_1H,
        get_PERIOD_4H,
        get_PERIOD_1D,
        get_POOL_FEE_RATE_BPS,
        get_QUOTE_REAL_CEILING,
        get_QUOTE_VIRTUAL_CEILING,
        get_QUOTE_VIRTUAL_FLOOR,
        get_REGISTRY_NAME,
        get_TRIGGER_MARKET_REGISTRATION,
        get_TRIGGER_PACKAGE_PUBLICATION,
        get_TRIGGER_SWAP_BUY,
        get_TRIGGER_SWAP_SELL,
        get_bps_fee_test_only as get_bps_fee,
        get_concatenation_test_only as get_concatenation,
        init_module_test_only as init_module,
        is_a_supported_chat_emoji,
        is_a_supported_symbol_emoji,
        market_view,
        market_metadata_by_emoji_bytes,
        pack_reserves,
        registry_address,
        register_market,
        register_market_without_publish,
        registry_view,
        simulate_swap,
        swap,
        tvl_clamm_test_only as tvl_clamm,
        unpack_chat,
        unpack_cumulative_stats,
        unpack_global_state,
        unpack_instantaneous_stats,
        unpack_last_swap,
        unpack_market_metadata,
        unpack_market_registration,
        unpack_market_view,
        unpack_periodic_state,
        unpack_periodic_state_metadata,
        unpack_periodic_state_tracker,
        unpack_registry_view,
        unpack_reserves,
        unpack_sequence_info,
        unpack_state,
        unpack_state_metadata,
        unpack_swap,
        unpack_tvl_to_lp_coin_ratio,
        valid_coin_types_test_only as valid_coin_types,
        verified_symbol_emoji_bytes,
    };
    use emojicoin_dot_fun::hex_codes::{
        get_metadata_bytes_test_only as get_metadata_bytes,
        get_split_module_bytes_test_only as get_split_module_bytes,
        get_coin_symbol_emojis_test_only as get_coin_symbol_emojis,
        get_publish_code_test_only as get_publish_code,
    };
    use emojicoin_dot_fun::test_acquisitions::{
        mint_aptos_coin_to,
    };
    use yellow_heart_market::coin_factory::{
        Emojicoin as YellowHeartEmojicoin,
        EmojicoinLP as YellowHeartEmojicoinLP,
        BadType,
    };
    use std::bcs;
    use std::option;
    use std::string::{Self, String, utf8};
    use std::type_info;
    use std::vector;

    struct PeriodicStateTrackerStartTimes has copy, drop, store {
        period_1M: u64,
        period_5M: u64,
        period_15M: u64,
        period_30M: u64,
        period_1H: u64,
        period_4H: u64,
        period_1D: u64,
    }

    struct SwapSimulationSetup has copy, drop, store {
        input_amount: u64,
        starts_in_bonding_curve: bool,
        clamm_virtual_reserves: MockReserves,
        cpamm_real_reserves: MockReserves,
        market_aptos_coin_balance: u64,
        market_emojicoin_balance: u64,
    }

    struct SwapSimulationResult has copy, drop, store {
        integrator_fee: u64,
        pool_fee_base: u64,
        pool_fee_quote: u64,
        net_proceeds: u64,
        base_volume: u64,
        quote_volume: u64,
        clamm_virtual_reserves: MockReserves,
        cpamm_real_reserves: MockReserves,
        results_in_state_transition: bool,
        market_aptos_coin_balance: u64,
        market_emojicoin_balance: u64,
    }

    struct MockChat has copy, drop, store {
        market_metadata: MockMarketMetadata,
        emit_time: u64,
        emit_market_nonce: u64,
        user: address,
        message: String,
        user_emojicoin_balance: u64,
        circulating_supply: u64,
        balance_as_fraction_of_circulating_supply_q64: u128,
    }

    struct MockCumulativeStats has copy, drop, store {
        base_volume: u128,
        quote_volume: u128,
        integrator_fees: u128,
        pool_fees_base: u128,
        pool_fees_quote: u128,
        n_swaps: u64,
        n_chat_messages: u64,
    }

    struct MockGlobalState has copy, drop, store {
        emit_time: u64,
        registry_nonce: u64,
        trigger: u8,
        cumulative_quote_volume: u128,
        total_quote_locked: u128,
        total_value_locked: u128,
        market_cap: u128,
        fully_diluted_value: u128,
        cumulative_integrator_fees: u128,
        cumulative_swaps: u64,
        cumulative_chat_messages: u64,
    }

    struct MockInstantaneousStats has copy, drop, store {
        total_quote_locked: u64,
        total_value_locked: u128,
        market_cap: u128,
        fully_diluted_value: u128,
    }

    struct MockLastSwap has copy, drop, store {
        is_sell: bool,
        avg_execution_price_q64: u128,
        base_volume: u64,
        quote_volume: u64,
        nonce: u64,
        time: u64,
    }

    struct MockMarketMetadata has copy, drop, store {
        market_id: u64,
        market_address: address,
        emoji_bytes: vector<u8>,
    }

    struct MockMarketRegistration has copy, drop, store {
        market_metadata: MockMarketMetadata,
        time: u64,
        registrant: address,
        integrator: address,
        integrator_fee: u64,
    }

    struct MockMarketView has copy, drop, store {
        metadata: MockMarketMetadata,
        sequence_info: MockSequenceInfo,
        clamm_virtual_reserves: MockReserves,
        cpamm_real_reserves: MockReserves,
        lp_coin_supply: u128,
        in_bonding_curve: bool,
        cumulative_stats: MockCumulativeStats,
        instantaneous_stats: MockInstantaneousStats,
        last_swap: MockLastSwap,
        periodic_state_trackers: vector<MockPeriodicStateTracker>,
        aptos_coin_balance: u64,
        emojicoin_balance: u64,
        emojicoin_lp_balance: u64,
    }

    struct MockPeriodicState has copy, drop, store {
        market_metadata: MockMarketMetadata,
        periodic_state_metadata: MockPeriodicStateMetadata,
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

    struct MockPeriodicStateTracker has copy, drop, store {
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
        tvl_to_lp_coin_ratio_start: MockTVLtoLPCoinRatio,
        tvl_to_lp_coin_ratio_end: MockTVLtoLPCoinRatio,
    }

    struct MockPeriodicStateMetadata has copy, drop, store {
        start_time: u64,
        period: u64,
        emit_time: u64,
        emit_market_nonce: u64,
        trigger: u8,
    }

    struct MockRegistryView has copy, drop, store {
        registry_address: address,
        nonce: u64,
        last_bump_time: u64,
        n_markets: u64,
        cumulative_quote_volume: u128,
        total_quote_locked: u128,
        total_value_locked: u128,
        market_cap: u128,
        fully_diluted_value: u128,
        cumulative_integrator_fees: u128,
        cumulative_swaps: u64,
        cumulative_chat_messages: u64,
    }

    struct MockTVLtoLPCoinRatio has copy, drop, store {
        tvl: u128,
        lp_coins: u128,
    }

    struct MockReserves has copy, drop, store {
        base: u64,
        quote: u64,
    }

    struct MockSequenceInfo has copy, drop, store {
        nonce: u64,
        last_bump_time: u64,
    }

    struct MockState has copy, drop, store {
        market_metadata: MockMarketMetadata,
        state_metadata: MockStateMetadata,
        clamm_virtual_reserves: MockReserves,
        cpamm_real_reserves: MockReserves,
        lp_coin_supply: u128,
        cumulative_stats: MockCumulativeStats,
        instantaneous_stats: MockInstantaneousStats,
        last_swap: MockLastSwap,
    }

    struct MockStateMetadata has copy, drop, store {
        market_nonce: u64,
        bump_time: u64,
        trigger: u8,
    }

    struct MockSwap has copy, drop, store {
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

    struct SwapGeneralCaseTestFlow has copy, drop, store {
        setup_is_simple_buy: bool,
        is_sell: bool,
        input_amount: u64,
    }

    struct SwapSetupCaseTestFlow has copy, drop, store {
        simulated_swap: Swap,
        mock_swap: MockSwap,
        user: address,
        integrator: address,
        mock_market_view: MockMarketView,
        mock_registry_view: MockRegistryView,
        mock_state: MockState,
    }

    // Test market emoji bytes.
    const BLACK_CAT: vector<u8> = x"f09f9088e2808de2ac9b";
    const BLACK_HEART: vector<u8> = x"f09f96a4";
    const YELLOW_HEART: vector<u8> = x"f09f929b";

    // Polarity based on `is_sell` argument for swap functions in main file.
    const SWAP_BUY: bool = false;
    const SWAP_SELL: bool = true;

    // For general case tests.
    const USER: address = @0xaaaaa;
    const INTEGRATOR: address = @0xbbbbb;
    const INTEGRATOR_FEE_RATE_BPS: u8 = 25;
    const GENERAL_CASE_SWAP_TIME: u64 = 700_000;

    // Constants for a simple buy against a new market (does not result in state transition), used
    // for assorted test setup.
    const SIMPLE_BUY_INPUT_AMOUNT: u64 = 111_111_111_111;
    const SIMPLE_BUY_INTEGRATOR: address = @0xddddd;
    const SIMPLE_BUY_INTEGRATOR_FEE_RATE_BPS: u8 = 50;
    const SIMPLE_BUY_QUOTE_DIVISOR: u64 = 9;
    const SIMPLE_BUY_TIME: u64 = 500_000;
    const SIMPLE_BUY_USER: address = @0xccccc;

    // Constants for a swap buy against a new market that results in an exact state transition (no
    // buying after the state transition), used for assorted test setup.
    const EXACT_TRANSITION_INPUT_AMOUNT: u64 = 1_000_000_000_000;
    const EXACT_TRANSITION_INTEGRATOR: address = @0xeeeee;
    const EXACT_TRANSITION_INTEGRATOR_FEE_RATE_BPS: u8 = 0;
    const EXACT_TRANSITION_TIME: u64 = 600_000;
    const EXACT_TRANSITION_USER: address = @0xfffff;

    public fun address_for_registered_market_by_emoji_bytes(
        emoji_bytes: vector<vector<u8>>,
    ): address {
        let (_, market_address, _) = unpack_market_metadata(
            metadata_for_registered_market_by_emoji_bytes(emoji_bytes)
        );
        market_address
    }

    public fun assert_chat(
        mock_chat: MockChat,
        chat: Chat,
    ) {
        let (
            market_metadata,
            emit_time,
            emit_market_nonce,
            user,
            message,
            user_emojicoin_balance,
            circulating_supply,
            balance_as_fraction_of_circulating_supply_q64,
        ) = unpack_chat(chat);
        assert_market_metadata(mock_chat.market_metadata, market_metadata);
        assert!(emit_time == mock_chat.emit_time, 0);
        assert!(emit_market_nonce == mock_chat.emit_market_nonce, 0);
        assert!(user == mock_chat.user, 0);
        assert!(message == mock_chat.message, 0);
        assert!(user_emojicoin_balance == mock_chat.user_emojicoin_balance, 0);
        assert!(circulating_supply == mock_chat.circulating_supply, 0);
        assert!(
            balance_as_fraction_of_circulating_supply_q64 ==
                mock_chat.balance_as_fraction_of_circulating_supply_q64,
            0
        );
    }

    public fun assert_market_metadata(
        mock_metadata: MockMarketMetadata,
        metadata: MarketMetadata,
    ) {
        let (market_id, market_address, emoji_bytes) = unpack_market_metadata(metadata);
        assert!(market_id == mock_metadata.market_id, 0);
        assert!(market_address == mock_metadata.market_address, 0);
        assert!(emoji_bytes == mock_metadata.emoji_bytes, 0);
    }

    public fun assert_market_registration(
        mock_market_registration: MockMarketRegistration,
        market_registration: MarketRegistration,
    ) {
        let (
            market_metadata,
            time,
            registrant,
            integrator,
            integrator_fee,
        ) = unpack_market_registration(market_registration);
        assert_market_metadata(mock_market_registration.market_metadata, market_metadata);
        assert!(time == mock_market_registration.time, 0);
        assert!(registrant == mock_market_registration.registrant, 0);
        assert!(integrator == mock_market_registration.integrator, 0);
        assert!(integrator_fee == mock_market_registration.integrator_fee, 0);
    }

    public fun assert_market_view(
        mock_market_view: MockMarketView,
        market_view: MarketView,
    ) {
        let (
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
        ) = unpack_market_view(market_view);
        assert_market_metadata(mock_market_view.metadata, metadata);
        assert_sequence_info(mock_market_view.sequence_info, sequence_info);
        assert_reserves(mock_market_view.clamm_virtual_reserves, clamm_virtual_reserves);
        assert_reserves(mock_market_view.cpamm_real_reserves, cpamm_real_reserves);
        assert!(lp_coin_supply == mock_market_view.lp_coin_supply, 0);
        assert!(in_bonding_curve == mock_market_view.in_bonding_curve, 0);
        assert_cumulative_stats(mock_market_view.cumulative_stats, cumulative_stats);
        assert_instantaneous_stats(mock_market_view.instantaneous_stats, instantaneous_stats);
        assert_last_swap(mock_market_view.last_swap, last_swap);
        assert!(vector::length(&periodic_state_trackers) ==
            vector::length(&mock_market_view.periodic_state_trackers), 0);
        for (i in 0..vector::length(&periodic_state_trackers)) {
            assert_periodic_state_tracker(
                *vector::borrow(&mock_market_view.periodic_state_trackers, i),
                *vector::borrow(&periodic_state_trackers, i),
            );
        };
        assert!(aptos_coin_balance == mock_market_view.aptos_coin_balance, 0);
        assert!(emojicoin_balance == mock_market_view.emojicoin_balance, 0);
        assert!(emojicoin_lp_balance == mock_market_view.emojicoin_lp_balance, 0);
    }

    public fun assert_registry_view(
        mock_registry_view: MockRegistryView,
        registry_view: RegistryView,
    ) {
        let (
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
        ) = unpack_registry_view(registry_view);
        assert!(registry_address == mock_registry_view.registry_address, 0);
        assert!(nonce == mock_registry_view.nonce, 0);
        assert!(last_bump_time == mock_registry_view.last_bump_time, 0);
        assert!(n_markets == mock_registry_view.n_markets, 0);
        assert!(read_snapshot(&cumulative_quote_volume)
            == mock_registry_view.cumulative_quote_volume, 0);
        assert!(read_snapshot(&total_quote_locked) == mock_registry_view.total_quote_locked, 0);
        assert!(read_snapshot(&total_value_locked) == mock_registry_view.total_value_locked, 0);
        assert!(read_snapshot(&market_cap) == mock_registry_view.market_cap, 0);
        assert!(read_snapshot(&fully_diluted_value) == mock_registry_view.fully_diluted_value, 0);
        assert!(read_snapshot(&cumulative_integrator_fees)
            == mock_registry_view.cumulative_integrator_fees, 0);
        assert!(read_snapshot(&cumulative_swaps) == mock_registry_view.cumulative_swaps, 0);
        assert!(read_snapshot(&cumulative_chat_messages)
            == mock_registry_view.cumulative_chat_messages, 0);
    }

    public fun assert_global_state(
        mock_global_state: MockGlobalState,
        global_state: GlobalState
    ) {
        let (
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
        ) = unpack_global_state(global_state);
        assert!(emit_time == mock_global_state.emit_time, 0);
        assert!(registry_nonce == mock_global_state.registry_nonce, 0);
        assert!(trigger == mock_global_state.trigger, 0);
        assert!(read_snapshot(&cumulative_quote_volume)
            == mock_global_state.cumulative_quote_volume, 0);
        assert!(read_snapshot(&total_quote_locked) == mock_global_state.total_quote_locked, 0);
        assert!(read_snapshot(&total_value_locked) == mock_global_state.total_value_locked, 0);
        assert!(read_snapshot(&market_cap) == mock_global_state.market_cap, 0);
        assert!(read_snapshot(&fully_diluted_value) == mock_global_state.fully_diluted_value, 0);
        assert!(read_snapshot(&cumulative_integrator_fees)
            == mock_global_state.cumulative_integrator_fees, 0);
        assert!(read_snapshot(&cumulative_swaps) == mock_global_state.cumulative_swaps, 0);
        assert!(read_snapshot(&cumulative_chat_messages)
            == mock_global_state.cumulative_chat_messages, 0);
    }

    public fun assert_periodic_state(
        mock_periodic_state: MockPeriodicState,
        periodic_state: PeriodicState,
    ) {
        let (
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
        ) = unpack_periodic_state(periodic_state);
        assert_market_metadata(mock_periodic_state.market_metadata, market_metadata);
        assert_periodic_state_metadata(
            mock_periodic_state.periodic_state_metadata,
            periodic_state_metadata,
        );
        assert!(open_price_q64 == mock_periodic_state.open_price_q64, 0);
        assert!(high_price_q64 == mock_periodic_state.high_price_q64, 0);
        assert!(low_price_q64 == mock_periodic_state.low_price_q64, 0);
        assert!(close_price_q64 == mock_periodic_state.close_price_q64, 0);
        assert!(volume_base == mock_periodic_state.volume_base, 0);
        assert!(volume_quote == mock_periodic_state.volume_quote, 0);
        assert!(integrator_fees == mock_periodic_state.integrator_fees, 0);
        assert!(pool_fees_base == mock_periodic_state.pool_fees_base, 0);
        assert!(pool_fees_quote == mock_periodic_state.pool_fees_quote, 0);
        assert!(n_swaps == mock_periodic_state.n_swaps, 0);
        assert!(n_chat_messages == mock_periodic_state.n_chat_messages, 0);
        assert!(starts_in_bonding_curve == mock_periodic_state.starts_in_bonding_curve, 0);
        assert!(ends_in_bonding_curve == mock_periodic_state.ends_in_bonding_curve, 0);
        assert!(tvl_per_lp_coin_growth_q64 == mock_periodic_state.tvl_per_lp_coin_growth_q64, 0);
    }

    public fun assert_periodic_state_metadata(
        mock_periodic_state_metadata: MockPeriodicStateMetadata,
        periodic_state_metadata: PeriodicStateMetadata,
    ) {
        let (
            start_time,
            period,
            emit_time,
            emit_market_nonce,
            trigger,
        ) = unpack_periodic_state_metadata(periodic_state_metadata);
        assert!(start_time == mock_periodic_state_metadata.start_time, 0);
        assert!(period == mock_periodic_state_metadata.period, 0);
        assert!(emit_time == mock_periodic_state_metadata.emit_time, 0);
        assert!(emit_market_nonce == mock_periodic_state_metadata.emit_market_nonce, 0);
        assert!(trigger == mock_periodic_state_metadata.trigger, 0);
    }

    public fun assert_periodic_state_tracker(
        mock_periodic_state_tracker: MockPeriodicStateTracker,
        periodic_state_tracker: PeriodicStateTracker,
    ) {
        let (
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
        ) = unpack_periodic_state_tracker(periodic_state_tracker);
        assert!(start_time == mock_periodic_state_tracker.start_time, 0);
        assert!(period == mock_periodic_state_tracker.period, 0);
        assert!(open_price_q64 == mock_periodic_state_tracker.open_price_q64, 0);
        assert!(high_price_q64 == mock_periodic_state_tracker.high_price_q64, 0);
        assert!(low_price_q64 == mock_periodic_state_tracker.low_price_q64, 0);
        assert!(close_price_q64 == mock_periodic_state_tracker.close_price_q64, 0);
        assert!(volume_base == mock_periodic_state_tracker.volume_base, 0);
        assert!(volume_quote == mock_periodic_state_tracker.volume_quote, 0);
        assert!(integrator_fees == mock_periodic_state_tracker.integrator_fees, 0);
        assert!(pool_fees_base == mock_periodic_state_tracker.pool_fees_base, 0);
        assert!(pool_fees_quote == mock_periodic_state_tracker.pool_fees_quote, 0);
        assert!(n_swaps == mock_periodic_state_tracker.n_swaps, 0);
        assert!(n_chat_messages == mock_periodic_state_tracker.n_chat_messages, 0);
        assert!(starts_in_bonding_curve == mock_periodic_state_tracker.starts_in_bonding_curve, 0);
        assert!(ends_in_bonding_curve == mock_periodic_state_tracker.ends_in_bonding_curve, 0);
        assert_tvl_to_lp_coin_ratio(
            mock_periodic_state_tracker.tvl_to_lp_coin_ratio_start,
            tvl_to_lp_coin_ratio_start,
        );
        assert_tvl_to_lp_coin_ratio(
            mock_periodic_state_tracker.tvl_to_lp_coin_ratio_end,
            tvl_to_lp_coin_ratio_end,
        );
    }

    public fun assert_reserves(
        mock_reserves: MockReserves,
        reserves: Reserves,
    ) {
        let (base, quote) = unpack_reserves(reserves);
        assert!(base == mock_reserves.base, 0);
        assert!(quote == mock_reserves.quote, 0);
    }

    public fun assert_sequence_info(
        mock_sequence_info: MockSequenceInfo,
        sequence_info: SequenceInfo,
    ) {
        let (nonce, last_bump_time) = unpack_sequence_info(sequence_info);
        assert!(nonce == mock_sequence_info.nonce, 0);
        assert!(last_bump_time == mock_sequence_info.last_bump_time, 0);
    }

    public fun assert_tvl_to_lp_coin_ratio(
        mock_tvl_to_lp_coin_ratio: MockTVLtoLPCoinRatio,
        tvl_to_lp_coin_ratio: TVLtoLPCoinRatio,
    ) {
        let (tvl, lp_coins) = unpack_tvl_to_lp_coin_ratio(tvl_to_lp_coin_ratio);
        assert!(tvl == mock_tvl_to_lp_coin_ratio.tvl, 0);
        assert!(lp_coins == mock_tvl_to_lp_coin_ratio.lp_coins, 0);
    }

    public fun assert_cumulative_stats(
        mock_cumulative_stats: MockCumulativeStats,
        cumulative_stats: CumulativeStats,
    ) {
        let (
            base_volume,
            quote_volume,
            integrator_fees,
            pool_fees_base,
            pool_fees_quote,
            n_swaps,
            n_chat_messages,
        ) = unpack_cumulative_stats(cumulative_stats);
        assert!(base_volume == mock_cumulative_stats.base_volume, 0);
        assert!(quote_volume == mock_cumulative_stats.quote_volume, 0);
        assert!(integrator_fees == mock_cumulative_stats.integrator_fees, 0);
        assert!(pool_fees_base == mock_cumulative_stats.pool_fees_base, 0);
        assert!(pool_fees_quote == mock_cumulative_stats.pool_fees_quote, 0);
        assert!(n_swaps == mock_cumulative_stats.n_swaps, 0);
        assert!(n_chat_messages == mock_cumulative_stats.n_chat_messages, 0);
    }

    public fun assert_instantaneous_stats(
        mock_instantaneous_stats: MockInstantaneousStats,
        instantaneous_stats: InstantaneousStats,
    ) {
        let (
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
        ) = unpack_instantaneous_stats(instantaneous_stats);
        assert!(total_quote_locked == mock_instantaneous_stats.total_quote_locked, 0);
        assert!(total_value_locked == mock_instantaneous_stats.total_value_locked, 0);
        assert!(market_cap == mock_instantaneous_stats.market_cap, 0);
        assert!(fully_diluted_value == mock_instantaneous_stats.fully_diluted_value, 0);
    }

    public fun assert_last_swap(
        mock_last_swap: MockLastSwap,
        last_swap: LastSwap,
    ) {
        let (
            is_sell,
            avg_execution_price_q64,
            base_volume,
            quote_volume,
            nonce,
            time,
        ) = unpack_last_swap(last_swap);
        assert!(is_sell == mock_last_swap.is_sell, 0);
        assert!(avg_execution_price_q64 == mock_last_swap.avg_execution_price_q64, 0);
        assert!(base_volume == mock_last_swap.base_volume, 0);
        assert!(quote_volume == mock_last_swap.quote_volume, 0);
        assert!(nonce == mock_last_swap.nonce, 0);
        assert!(time == mock_last_swap.time, 0);
    }

    public fun assert_state(
        mock_state: MockState,
        state: State,
    ) {
        let (
            market_metadata,
            state_metadata,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            lp_coin_supply,
            cumulative_stats,
            instantaneous_stats,
            last_swap,
        ) = unpack_state(state);
        assert_market_metadata(mock_state.market_metadata, market_metadata);
        assert_state_metadata(mock_state.state_metadata, state_metadata);
        assert_reserves(mock_state.clamm_virtual_reserves, clamm_virtual_reserves);
        assert_reserves(mock_state.cpamm_real_reserves, cpamm_real_reserves);
        assert!(lp_coin_supply == mock_state.lp_coin_supply, 0);
        assert_cumulative_stats(mock_state.cumulative_stats, cumulative_stats);
        assert_instantaneous_stats(mock_state.instantaneous_stats, instantaneous_stats);
        assert_last_swap(mock_state.last_swap, last_swap);
    }

    public fun assert_state_metadata(
        mock_state_metadata: MockStateMetadata,
        state_metadata: StateMetadata,
    ) {
        let (market_nonce, bump_time, trigger) = unpack_state_metadata(state_metadata);
        assert!(market_nonce == mock_state_metadata.market_nonce, 0);
        assert!(bump_time == mock_state_metadata.bump_time, 0);
        assert!(trigger == mock_state_metadata.trigger, 0);
    }

    public fun assert_swap(
        mock_swap: MockSwap,
        swap: Swap,
    ) {
        let (
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
        ) = unpack_swap(swap);
        assert!(market_id == mock_swap.market_id, 0);
        assert!(time == mock_swap.time, 0);
        assert!(market_nonce == mock_swap.market_nonce, 0);
        assert!(swapper == mock_swap.swapper, 0);
        assert!(input_amount == mock_swap.input_amount, 0);
        assert!(is_sell == mock_swap.is_sell, 0);
        assert!(integrator == mock_swap.integrator, 0);
        assert!(integrator_fee_rate_bps == mock_swap.integrator_fee_rate_bps, 0);
        assert!(net_proceeds == mock_swap.net_proceeds, 0);
        assert!(base_volume == mock_swap.base_volume, 0);
        assert!(quote_volume == mock_swap.quote_volume, 0);
        assert!(avg_execution_price_q64 == mock_swap.avg_execution_price_q64, 0);
        assert!(integrator_fee == mock_swap.integrator_fee, 0);
        assert!(pool_fee == mock_swap.pool_fee, 0);
        assert!(starts_in_bonding_curve == mock_swap.starts_in_bonding_curve, 0);
        assert!(results_in_state_transition == mock_swap.results_in_state_transition, 0);
    }

    public fun assert_test_market_address(
        emoji_bytes: vector<vector<u8>>,
        hard_coded_address: address,
        publish_code: bool,
    ) {
        mint_aptos_coin_to(USER, get_MARKET_REGISTRATION_FEE());
        if (publish_code) { // Only one publication operation allowed per transaction.
            register_market(&get_signer(USER), emoji_bytes, INTEGRATOR);
        } else {
            register_market_without_publish(&get_signer(USER), emoji_bytes, INTEGRATOR);
        };
        let derived_market_address = address_for_registered_market_by_emoji_bytes(emoji_bytes);
        assert!(derived_market_address == hard_coded_address, 0);
    }

    public fun assert_coin_name_and_symbol<Emojicoin, EmojicoinLP>(
        emoji_bytes: vector<vector<u8>>,
        expected_lp_symbol: vector<u8>,
    ) {
        init_market_and_coins_via_swap<Emojicoin, EmojicoinLP>(emoji_bytes);

        // Test emojicoin name and symbol.
        let symbol = utf8(verified_symbol_emoji_bytes(emoji_bytes));
        let name = get_concatenation(symbol, utf8(get_EMOJICOIN_NAME_SUFFIX()));
        assert!(coin::symbol<Emojicoin>() == symbol, 0);
        assert!(coin::name<Emojicoin>() == name, 0);

        // Test LP coin name and symbols.
        let market_id = market_id_for_registered_market_by_emoji_bytes(emoji_bytes);
        let lp_symbol = get_concatenation(
            utf8(get_EMOJICOIN_LP_SYMBOL_PREFIX()),
            string_utils::to_string(&market_id),
        );
        assert!(utf8(expected_lp_symbol) == lp_symbol, 0);
        let lp_name = get_concatenation(symbol, utf8(get_EMOJICOIN_LP_NAME_SUFFIX()));
        assert!(coin::symbol<EmojicoinLP>() == lp_symbol, 0);
        assert!(coin::name<EmojicoinLP>() == lp_name, 0);
    }

    public fun apply_periodic_state_tracker_start_times(
        periodic_state_trackers_ref_mut: &mut vector<MockPeriodicStateTracker>,
        start_times: PeriodicStateTrackerStartTimes,
    ) {
        vector::borrow_mut(periodic_state_trackers_ref_mut, 0).start_time = start_times.period_1M;
        vector::borrow_mut(periodic_state_trackers_ref_mut, 1).start_time = start_times.period_5M;
        vector::borrow_mut(periodic_state_trackers_ref_mut, 2).start_time = start_times.period_15M;
        vector::borrow_mut(periodic_state_trackers_ref_mut, 3).start_time = start_times.period_30M;
        vector::borrow_mut(periodic_state_trackers_ref_mut, 4).start_time = start_times.period_1H;
        vector::borrow_mut(periodic_state_trackers_ref_mut, 5).start_time = start_times.period_4H;
        vector::borrow_mut(periodic_state_trackers_ref_mut, 6).start_time = start_times.period_1D;
    }

    public fun base_clamm_virtual_reserves(): MockReserves {
        MockReserves {
            base: get_BASE_VIRTUAL_CEILING(),
            quote: get_QUOTE_VIRTUAL_FLOOR(),
        }
    }

    public fun base_clamm_virtual_reserves_simple_buy(): MockReserves {
        let swap = base_swap_simple_buy();
        MockReserves {
            base: get_BASE_VIRTUAL_CEILING() - swap.base_volume,
            quote: get_QUOTE_VIRTUAL_FLOOR() + swap.quote_volume,
        }
    }

    public fun base_clamm_virtual_reserves_exact_transition(): MockReserves {
        MockReserves { base: 0, quote: 0 }
    }

    public fun base_cpamm_real_reserves(): MockReserves {
        MockReserves { base: 0, quote: 0 }
    }

    public fun base_cpamm_real_reserves_exact_transition(): MockReserves {
        MockReserves { base: get_EMOJICOIN_REMAINDER(), quote: get_QUOTE_REAL_CEILING() }
    }

    public fun base_cumulative_stats(): MockCumulativeStats {
        MockCumulativeStats {
            base_volume: 0,
            quote_volume: 0,
            integrator_fees: 0,
            pool_fees_base: 0,
            pool_fees_quote: 0,
            n_swaps: 0,
            n_chat_messages: 0,
        }
    }

    public fun base_cumulative_stats_simple_buy(): MockCumulativeStats {
        let swap = base_swap_simple_buy();
        MockCumulativeStats {
            base_volume: (swap.base_volume as u128),
            quote_volume: (swap.quote_volume as u128),
            integrator_fees: (swap.integrator_fee as u128),
            pool_fees_base: 0,
            pool_fees_quote: 0,
            n_swaps: 1,
            n_chat_messages: 0,
        }
    }

    public fun base_cumulative_stats_exact_transition(): MockCumulativeStats {
        MockCumulativeStats {
            base_volume: (get_BASE_REAL_CEILING() as u128),
            quote_volume: (get_QUOTE_REAL_CEILING() as u128),
            integrator_fees: 0,
            pool_fees_base: 0,
            pool_fees_quote: 0,
            n_swaps: 1,
            n_chat_messages: 0,
        }
    }

    public fun base_global_state(): MockGlobalState {
        MockGlobalState {
            emit_time: 0,
            registry_nonce: 1,
            trigger: get_TRIGGER_PACKAGE_PUBLICATION(),
            cumulative_quote_volume: 0,
            total_quote_locked: 0,
            total_value_locked: 0,
            market_cap: 0,
            fully_diluted_value: 0,
            cumulative_integrator_fees: 0,
            cumulative_swaps: 0,
            cumulative_chat_messages: 0,
        }
    }

    public fun base_instantaneous_stats(): MockInstantaneousStats {
        MockInstantaneousStats {
            total_quote_locked: 0,
            total_value_locked: 0,
            market_cap: 0,
            fully_diluted_value: fdv_for_newly_registered_market(),
        }
    }

    public fun base_instantaneous_stats_simple_buy(): MockInstantaneousStats {
        let clamm_virtual_reserves = base_clamm_virtual_reserves_simple_buy();
        let swap = base_swap_simple_buy();
        let total_quote_locked = swap.quote_volume;
        let total_base_locked = get_EMOJICOIN_SUPPLY() - swap.base_volume;
        let price_base = (clamm_virtual_reserves.base as u128);
        let price_quote = (clamm_virtual_reserves.quote as u128);
        let total_base_locked_denominated_in_quote =
            (((total_base_locked as u128) * price_quote) / price_base);
        let total_value_locked =
            (total_quote_locked as u128) + total_base_locked_denominated_in_quote;
        let market_cap = (((swap.base_volume as u128) * price_quote) / price_base);
        let fully_diluted_value = (((get_EMOJICOIN_SUPPLY() as u128) * price_quote) / price_base);
        MockInstantaneousStats {
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
        }
    }

    public fun base_instantaneous_stats_exact_transition(): MockInstantaneousStats {
        let price_quote = (get_QUOTE_REAL_CEILING() as u128);
        let price_base = (get_EMOJICOIN_REMAINDER() as u128);
        MockInstantaneousStats {
            total_quote_locked: get_QUOTE_REAL_CEILING(),
            total_value_locked: ((2 * get_QUOTE_REAL_CEILING()) as u128),
            market_cap: (price_quote) * (get_BASE_REAL_CEILING() as u128) / (price_base),
            fully_diluted_value: (price_quote) * (get_EMOJICOIN_SUPPLY() as u128) / (price_base),
        }
    }

    public fun base_last_swap(): MockLastSwap {
        MockLastSwap {
            is_sell: false,
            avg_execution_price_q64: 0,
            base_volume: 0,
            quote_volume: 0,
            nonce: 0,
            time: 0,
        }
    }

    public fun base_last_swap_simple_buy(): MockLastSwap {
        let swap = base_swap_simple_buy();
        MockLastSwap {
            is_sell: SWAP_BUY,
            avg_execution_price_q64: swap.avg_execution_price_q64,
            base_volume: swap.base_volume,
            quote_volume: swap.quote_volume,
            nonce: base_sequence_info_simple_buy().nonce,
            time: SIMPLE_BUY_TIME,
        }
    }

    public fun base_last_swap_exact_transition(): MockLastSwap {
        let swap = base_swap_exact_transition();
        MockLastSwap {
            is_sell: SWAP_BUY,
            avg_execution_price_q64: swap.avg_execution_price_q64,
            base_volume: swap.base_volume,
            quote_volume: swap.quote_volume,
            nonce: base_sequence_info_exact_transition().nonce,
            time: EXACT_TRANSITION_TIME,
        }
    }

    public fun base_market_metadata(): MockMarketMetadata {
        MockMarketMetadata {
            market_id: 1,
            market_address: @black_cat_market,
            emoji_bytes: BLACK_CAT,
        }
    }

    public fun base_market_registration(): MockMarketRegistration {
        MockMarketRegistration {
            market_metadata: base_market_metadata(),
            time: 0,
            registrant: USER,
            integrator: INTEGRATOR,
            integrator_fee: 0,
        }
    }

    public fun base_market_view(): MockMarketView {
        MockMarketView {
            metadata: base_market_metadata(),
            sequence_info: MockSequenceInfo {
                nonce: 1,
                last_bump_time: 0,
            },
            clamm_virtual_reserves: base_clamm_virtual_reserves(),
            cpamm_real_reserves: base_cpamm_real_reserves(),
            lp_coin_supply: 0,
            in_bonding_curve: true,
            cumulative_stats: base_cumulative_stats(),
            instantaneous_stats: base_instantaneous_stats(),
            last_swap: base_last_swap(),
            periodic_state_trackers:
                vectorize_periodic_state_tracker_base(base_periodic_state_tracker()),
            aptos_coin_balance: 0,
            emojicoin_balance: get_EMOJICOIN_SUPPLY(),
            emojicoin_lp_balance: 0,
        }
    }

    public fun base_market_view_simple_buy(): MockMarketView {
        let swap = base_swap_simple_buy();
        let market_view = base_market_view();
        market_view.sequence_info = base_sequence_info_simple_buy();
        market_view.clamm_virtual_reserves = base_clamm_virtual_reserves_simple_buy();
        market_view.cumulative_stats = base_cumulative_stats_simple_buy();
        market_view.instantaneous_stats = base_instantaneous_stats_simple_buy();
        market_view.last_swap = base_last_swap_simple_buy();
        market_view.periodic_state_trackers =
            vectorize_periodic_state_tracker_base(base_periodic_state_tracker_simple_buy());
        market_view.aptos_coin_balance = swap.quote_volume;
        market_view.emojicoin_balance = get_EMOJICOIN_SUPPLY() - swap.base_volume;
        market_view
    }

    public fun base_market_view_exact_transition(): MockMarketView {
        MockMarketView {
            metadata: base_market_metadata(),
            sequence_info: base_sequence_info_exact_transition(),
            clamm_virtual_reserves: base_clamm_virtual_reserves_exact_transition(),
            cpamm_real_reserves: base_cpamm_real_reserves_exact_transition(),
            lp_coin_supply: (get_LP_TOKENS_INITIAL() as u128),
            in_bonding_curve: false,
            cumulative_stats: base_cumulative_stats_exact_transition(),
            instantaneous_stats: base_instantaneous_stats_exact_transition(),
            last_swap: base_last_swap_exact_transition(),
            periodic_state_trackers: vectorize_periodic_state_tracker_base(
                base_periodic_state_tracker_exact_transition()
            ),
            aptos_coin_balance: get_QUOTE_REAL_CEILING(),
            emojicoin_balance: get_EMOJICOIN_REMAINDER(),
            emojicoin_lp_balance: get_LP_TOKENS_INITIAL(),
        }
    }

    public fun base_periodic_state_tracker(): MockPeriodicStateTracker {
        MockPeriodicStateTracker {
            start_time: 0,
            period: 0,
            open_price_q64: 0,
            high_price_q64: 0,
            low_price_q64: 0,
            close_price_q64: 0,
            volume_base: 0,
            volume_quote: 0,
            integrator_fees: 0,
            pool_fees_base: 0,
            pool_fees_quote: 0,
            n_swaps: 0,
            n_chat_messages: 0,
            starts_in_bonding_curve: true,
            ends_in_bonding_curve: true,
            tvl_to_lp_coin_ratio_start: base_tvl_to_lp_coin_ratio(),
            tvl_to_lp_coin_ratio_end: base_tvl_to_lp_coin_ratio(),
        }
    }

    public fun base_periodic_state_tracker_simple_buy(): MockPeriodicStateTracker {
        let swap = base_swap_simple_buy();
        let periodic_state_tracker = base_periodic_state_tracker();
        periodic_state_tracker.open_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.high_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.low_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.close_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.volume_base = (swap.base_volume as u128);
        periodic_state_tracker.volume_quote = (swap.quote_volume as u128);
        periodic_state_tracker.integrator_fees = (swap.integrator_fee as u128);
        periodic_state_tracker.n_swaps = 1;
        periodic_state_tracker.tvl_to_lp_coin_ratio_end = base_tvl_to_lp_coin_ratio_simple_buy();
        periodic_state_tracker
    }

    public fun base_periodic_state_tracker_exact_transition(): MockPeriodicStateTracker {
        let swap = base_swap_exact_transition();
        let periodic_state_tracker = base_periodic_state_tracker_simple_buy();
        periodic_state_tracker.open_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.high_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.low_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.close_price_q64 = swap.avg_execution_price_q64;
        periodic_state_tracker.volume_base = (swap.base_volume as u128);
        periodic_state_tracker.volume_quote = (swap.quote_volume as u128);
        periodic_state_tracker.integrator_fees = 0;
        periodic_state_tracker.ends_in_bonding_curve = false;
        periodic_state_tracker.tvl_to_lp_coin_ratio_end =
            base_tvl_to_lp_coin_ratio_exact_transition();
        periodic_state_tracker
    }

    public fun base_registry_view(): MockRegistryView {
        MockRegistryView {
            registry_address: derived_registry_address(),
            nonce: 1,
            last_bump_time: 0,
            n_markets: 0,
            cumulative_quote_volume: 0,
            total_quote_locked: 0,
            total_value_locked: 0,
            market_cap: 0,
            fully_diluted_value: 0,
            cumulative_integrator_fees: 0,
            cumulative_swaps: 0,
            cumulative_chat_messages: 0,
        }
    }

    public fun base_registry_view_simple_buy(): MockRegistryView {
        let swap = base_swap_simple_buy();
        let instantaneous_stats = base_instantaneous_stats_simple_buy();
        MockRegistryView {
            registry_address: derived_registry_address(),
            nonce: 3,
            last_bump_time: 0,
            n_markets: 1,
            cumulative_quote_volume: (swap.quote_volume as u128),
            total_quote_locked: (swap.quote_volume as u128),
            total_value_locked: instantaneous_stats.total_value_locked,
            market_cap: instantaneous_stats.market_cap,
            fully_diluted_value: instantaneous_stats.fully_diluted_value,
            cumulative_integrator_fees: (swap.integrator_fee as u128),
            cumulative_swaps: 1,
            cumulative_chat_messages: 0,
        }
    }

    public fun base_registry_view_exact_transition(): MockRegistryView {
        let swap = base_swap_exact_transition();
        let instantaneous_stats = base_instantaneous_stats_exact_transition();
        MockRegistryView {
            registry_address: derived_registry_address(),
            nonce: 3,
            last_bump_time: 0,
            n_markets: 1,
            cumulative_quote_volume: (swap.quote_volume as u128),
            total_quote_locked: (swap.quote_volume as u128),
            total_value_locked: instantaneous_stats.total_value_locked,
            market_cap: instantaneous_stats.market_cap,
            fully_diluted_value: instantaneous_stats.fully_diluted_value,
            cumulative_integrator_fees: 0,
            cumulative_swaps: 1,
            cumulative_chat_messages: 0,
        }
    }

    public fun base_sequence_info(): MockSequenceInfo {
        MockSequenceInfo {
            nonce: 1,
            last_bump_time: 0,
        }
    }

    public fun base_sequence_info_simple_buy(): MockSequenceInfo {
        MockSequenceInfo {
            nonce: 2,
            last_bump_time: SIMPLE_BUY_TIME,
        }
    }

    public fun base_sequence_info_exact_transition(): MockSequenceInfo {
        MockSequenceInfo {
            nonce: 2,
            last_bump_time: EXACT_TRANSITION_TIME,
        }
    }

    public fun base_state(): MockState {
        MockState {
            market_metadata: base_market_metadata(),
            state_metadata: base_state_metadata(),
            clamm_virtual_reserves: base_clamm_virtual_reserves(),
            cpamm_real_reserves: base_cpamm_real_reserves(),
            lp_coin_supply: 0,
            cumulative_stats: base_cumulative_stats(),
            instantaneous_stats: base_instantaneous_stats(),
            last_swap: base_last_swap(),
        }
    }

    public fun base_state_simple_buy(): MockState {
        let state = base_state();
        state.state_metadata = base_state_metadata_simple_buy();
        state.clamm_virtual_reserves = base_clamm_virtual_reserves_simple_buy();
        state.cumulative_stats = base_cumulative_stats_simple_buy();
        state.instantaneous_stats = base_instantaneous_stats_simple_buy();
        state.last_swap = base_last_swap_simple_buy();
        state
    }

    public fun base_state_exact_transition(): MockState {
        MockState {
            market_metadata: base_market_metadata(),
            state_metadata: base_state_metadata_exact_transition(),
            clamm_virtual_reserves: base_clamm_virtual_reserves_exact_transition(),
            cpamm_real_reserves: base_cpamm_real_reserves_exact_transition(),
            lp_coin_supply: (get_LP_TOKENS_INITIAL() as u128),
            cumulative_stats: base_cumulative_stats_exact_transition(),
            instantaneous_stats: base_instantaneous_stats_exact_transition(),
            last_swap: base_last_swap_exact_transition(),
        }
    }

    public fun base_state_metadata(): MockStateMetadata {
        MockStateMetadata {
            market_nonce: 1,
            bump_time: 0,
            trigger: get_TRIGGER_MARKET_REGISTRATION(),
        }
    }

    public fun base_state_metadata_simple_buy(): MockStateMetadata {
        MockStateMetadata {
            market_nonce: 2,
            bump_time: SIMPLE_BUY_TIME,
            trigger: get_TRIGGER_SWAP_BUY(),
        }
    }

    public fun base_state_metadata_exact_transition(): MockStateMetadata {
        MockStateMetadata {
            market_nonce: 2,
            bump_time: EXACT_TRANSITION_TIME,
            trigger: get_TRIGGER_SWAP_BUY(),
        }
    }

    public fun base_swap_exact_transition(): MockSwap {
        let base_volume = get_BASE_REAL_CEILING();
        let quote_volume = get_QUOTE_REAL_CEILING();
        MockSwap {
            market_id: 1,
            time: EXACT_TRANSITION_TIME,
            market_nonce: 2,
            swapper: EXACT_TRANSITION_USER,
            input_amount: EXACT_TRANSITION_INPUT_AMOUNT,
            is_sell: SWAP_BUY,
            integrator: EXACT_TRANSITION_INTEGRATOR,
            integrator_fee_rate_bps: EXACT_TRANSITION_INTEGRATOR_FEE_RATE_BPS,
            net_proceeds: base_volume,
            base_volume,
            quote_volume: get_QUOTE_REAL_CEILING(),
            avg_execution_price_q64: ((quote_volume as u128) << 64) / (base_volume as u128),
            integrator_fee: 0,
            pool_fee: 0,
            starts_in_bonding_curve: true,
            results_in_state_transition: true,
        }
    }

    public fun base_swap_simple_buy(): MockSwap {
        let integrator_fee =
            get_bps_fee(SIMPLE_BUY_INPUT_AMOUNT, SIMPLE_BUY_INTEGRATOR_FEE_RATE_BPS);
        let quote_volume = SIMPLE_BUY_INPUT_AMOUNT - integrator_fee;

        // Define base volume via constant product terms from simple CPAMM equation in blackpaper.
        let b_0 = (get_BASE_VIRTUAL_CEILING() as u128);
        let q_in = (quote_volume as u128);
        let q_0 = (get_QUOTE_VIRTUAL_FLOOR() as u128);
        let base_volume = (((b_0 * q_in) / (q_0 + q_in)) as u64);

        MockSwap {
            market_id: 1,
            time: SIMPLE_BUY_TIME,
            market_nonce: 2,
            swapper: SIMPLE_BUY_USER,
            input_amount: SIMPLE_BUY_INPUT_AMOUNT,
            is_sell: SWAP_BUY,
            integrator: SIMPLE_BUY_INTEGRATOR,
            integrator_fee_rate_bps: SIMPLE_BUY_INTEGRATOR_FEE_RATE_BPS,
            net_proceeds: base_volume,
            base_volume,
            quote_volume,
            avg_execution_price_q64: ((quote_volume as u128) << 64) / (base_volume as u128),
            integrator_fee,
            pool_fee: 0,
            starts_in_bonding_curve: true,
            results_in_state_transition: false,
        }
    }

    public fun base_tvl_to_lp_coin_ratio(): MockTVLtoLPCoinRatio {
        MockTVLtoLPCoinRatio {
            tvl: 0,
            lp_coins: 0,
        }
    }

    public fun base_tvl_to_lp_coin_ratio_simple_buy(): MockTVLtoLPCoinRatio {
        let instantaneous_stats = base_instantaneous_stats_simple_buy();
        MockTVLtoLPCoinRatio {
            tvl: instantaneous_stats.total_value_locked,
            lp_coins: 0,
        }
    }

    public fun base_tvl_to_lp_coin_ratio_exact_transition(): MockTVLtoLPCoinRatio {
        let instantaneous_stats = base_instantaneous_stats_exact_transition();
        MockTVLtoLPCoinRatio {
            tvl: instantaneous_stats.total_value_locked,
            lp_coins: (get_LP_TOKENS_INITIAL() as u128),
        }
    }

    public fun derived_registry_address(): address {
        object::create_object_address(&@emojicoin_dot_fun, get_REGISTRY_NAME())
    }

    public fun fdv_for_newly_registered_market(): u128 {
        (
            (
                (get_QUOTE_VIRTUAL_FLOOR() as u256) * (get_EMOJICOIN_SUPPLY() as u256) /
                (get_BASE_VIRTUAL_CEILING() as u256)
            ) as u128
        )
    }

    public fun init_market(
        emoji_bytes: vector<vector<u8>>,
    ) {
        let registry_view = registry_view();
        let (_, _, _, n_markets, _, _, _, _, _, _, _, _,) = unpack_registry_view(registry_view);
        if (n_markets > 0) mint_aptos_coin_to(USER, get_MARKET_REGISTRATION_FEE());
        register_market_without_publish(&get_signer(USER), emoji_bytes, INTEGRATOR);
    }

    public fun init_market_and_coins_via_swap<Emojicoin, EmojicoinLP>(
        emoji_bytes: vector<vector<u8>>,
    ) {
        init_market(emoji_bytes);
        let input_amount = 100;
        mint_aptos_coin_to(USER, input_amount);
        let integrator_fee_rate_bps = 0;
        swap<Emojicoin, EmojicoinLP>(
            address_for_registered_market_by_emoji_bytes(emoji_bytes),
            &get_signer(USER),
            input_amount,
            SWAP_BUY,
            INTEGRATOR,
            integrator_fee_rate_bps,
        );
    }

    public fun init_package() {
        timestamp::set_time_has_started_for_testing(&get_signer(@aptos_framework));
        init_module(&get_signer(@emojicoin_dot_fun));
    }

    public fun init_package_then_simple_buy(): Swap {
        init_package();
        timestamp::update_global_time_for_test(SIMPLE_BUY_TIME);
        init_market(vector[BLACK_CAT]);
        mint_aptos_coin_to(SIMPLE_BUY_USER, SIMPLE_BUY_INPUT_AMOUNT);
        let market_address = base_market_metadata().market_address;
        let simulated_swap = simulate_swap(
            market_address,
            SIMPLE_BUY_USER,
            SIMPLE_BUY_INPUT_AMOUNT,
            SWAP_BUY,
            SIMPLE_BUY_INTEGRATOR,
            SIMPLE_BUY_INTEGRATOR_FEE_RATE_BPS,
        );
        swap<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            market_address,
            &get_signer(SIMPLE_BUY_USER),
            SIMPLE_BUY_INPUT_AMOUNT,
            SWAP_BUY,
            SIMPLE_BUY_INTEGRATOR,
            SIMPLE_BUY_INTEGRATOR_FEE_RATE_BPS,
        );
        simulated_swap
    }

    public fun init_package_then_exact_transition(): Swap {
        init_package();
        timestamp::update_global_time_for_test(EXACT_TRANSITION_TIME);
        init_market(vector[BLACK_CAT]);
        mint_aptos_coin_to(EXACT_TRANSITION_USER, EXACT_TRANSITION_INPUT_AMOUNT);
        let market_address = base_market_metadata().market_address;
        let simulated_swap = simulate_swap(
            market_address,
            EXACT_TRANSITION_USER,
            EXACT_TRANSITION_INPUT_AMOUNT,
            SWAP_BUY,
            EXACT_TRANSITION_INTEGRATOR,
            EXACT_TRANSITION_INTEGRATOR_FEE_RATE_BPS,
        );
        swap<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            market_address,
            &get_signer(EXACT_TRANSITION_USER),
            EXACT_TRANSITION_INPUT_AMOUNT,
            SWAP_BUY,
            EXACT_TRANSITION_INTEGRATOR,
            EXACT_TRANSITION_INTEGRATOR_FEE_RATE_BPS,
        );
        simulated_swap
    }

    public fun market_id_for_registered_market_by_emoji_bytes(
        emoji_bytes: vector<vector<u8>>,
    ): u64 {
        let (market_id, _, _) = unpack_market_metadata(
            metadata_for_registered_market_by_emoji_bytes(emoji_bytes)
        );
        market_id
    }

    public fun metadata_for_registered_market_by_emoji_bytes(
        emoji_bytes: vector<vector<u8>>,
    ): MarketMetadata {
         option::destroy_some(
            market_metadata_by_emoji_bytes(verified_symbol_emoji_bytes(emoji_bytes))
        )
    }

    public fun pack_mock_reserves(
        mock_reserves: MockReserves
    ): Reserves {
        pack_reserves(mock_reserves.base, mock_reserves.quote)
    }

    public fun swap_general_case_follow_up_input_amount_to_trigger_state_transition(): u64 {
        let quote_to_transition = ((get_QUOTE_VIRTUAL_CEILING() -
            base_market_view_simple_buy().clamm_virtual_reserves.quote) as u128);
        ((
            (get_BASIS_POINTS_PER_UNIT() * quote_to_transition) /
            (get_BASIS_POINTS_PER_UNIT() - (INTEGRATOR_FEE_RATE_BPS as u128))
        ) as u64)
    }

    public fun swap_general_case_test_flow(
        flow: SwapGeneralCaseTestFlow
    ) {
        // Determine base structs at end of setup swap, if swap starts in bonding curve.
        let (
            setup_swap,
            setup_market_view,
            setup_registry_view,
            setup_periodic_state_tracker,
            setup_state,
            starts_in_bonding_curve,
        ) = if (flow.setup_is_simple_buy) {
            init_package_then_simple_buy();
            (
                base_swap_simple_buy(),
                base_market_view_simple_buy(),
                base_registry_view_simple_buy(),
                base_periodic_state_tracker_simple_buy(),
                base_state_simple_buy(),
                true,
            )
        } else {
            init_package_then_exact_transition();
            (
                base_swap_exact_transition(),
                base_market_view_exact_transition(),
                base_registry_view_exact_transition(),
                base_periodic_state_tracker_exact_transition(),
                base_state_exact_transition(),
                false,
            )
        };

        // Fund general case swap user with input amount.
        if (flow.is_sell) {
            let sender = if (flow.setup_is_simple_buy) SIMPLE_BUY_USER else EXACT_TRANSITION_USER;
            aptos_account::transfer_coins<BlackCatEmojicoin>(
                &get_signer(sender),
                USER,
                flow.input_amount
            );
        } else {
            mint_aptos_coin_to(USER, flow.input_amount);
        };

        // Update global time, simulate swap, then execute swap.
        timestamp::update_global_time_for_test(GENERAL_CASE_SWAP_TIME);
        let market_address = base_market_metadata().market_address;
        let simulated_swap = simulate_swap(
            market_address,
            USER,
            flow.input_amount,
            flow.is_sell,
            INTEGRATOR,
            INTEGRATOR_FEE_RATE_BPS,
        );
        swap<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            market_address,
            &get_signer(USER),
            flow.input_amount,
            flow.is_sell,
            INTEGRATOR,
            INTEGRATOR_FEE_RATE_BPS,
        );

        // Determine volume/fee amounts based on simulated swap.
        let integrator_fee;
        let pool_fee_base = 0;
        let pool_fee_quote = 0;
        let net_proceeds;
        let base_volume;
        let quote_volume;
        let results_in_state_transition = false;
        let clamm_virtual_reserves = setup_market_view.clamm_virtual_reserves;
        let cpamm_real_reserves = setup_market_view.cpamm_real_reserves;
        let market_aptos_coin_balance;
        let market_emojicoin_balance;
        if (flow.is_sell) { // No opportunity for state transition.
            let q_out_clamm = cpamm_simple_swap_output_amount(
                flow.input_amount,
                SWAP_SELL,
                pack_mock_reserves(if (starts_in_bonding_curve)
                    clamm_virtual_reserves else cpamm_real_reserves
                ),
            );
            integrator_fee = get_bps_fee(q_out_clamm, INTEGRATOR_FEE_RATE_BPS);
            if (!starts_in_bonding_curve)
                pool_fee_quote = get_bps_fee(q_out_clamm, get_POOL_FEE_RATE_BPS());
            let quote_leaving_market = q_out_clamm - pool_fee_quote;
            quote_volume = q_out_clamm - integrator_fee - pool_fee_quote;
            base_volume = flow.input_amount;
            net_proceeds = quote_volume;
            if (starts_in_bonding_curve) {
                clamm_virtual_reserves = MockReserves {
                    base: clamm_virtual_reserves.base + base_volume,
                    quote: clamm_virtual_reserves.quote - quote_leaving_market,
                };
            } else {
                cpamm_real_reserves = MockReserves {
                    base: cpamm_real_reserves.base + base_volume,
                    quote: cpamm_real_reserves.quote - quote_leaving_market,
                };
            };
            market_aptos_coin_balance = setup_market_view.aptos_coin_balance - quote_leaving_market;
            market_emojicoin_balance = setup_market_view.emojicoin_balance + base_volume;
        } else { // Swap buy.
            integrator_fee = get_bps_fee(flow.input_amount, INTEGRATOR_FEE_RATE_BPS);
            quote_volume = flow.input_amount - integrator_fee;
            if (!starts_in_bonding_curve) { // In CPAMM, no opportunity for state transition.
                let b_out = cpamm_simple_swap_output_amount(
                    quote_volume,
                    SWAP_BUY,
                    pack_mock_reserves(setup_market_view.cpamm_real_reserves)
                );
                pool_fee_base = get_bps_fee(b_out, get_POOL_FEE_RATE_BPS());
                base_volume = b_out - pool_fee_base;
                cpamm_real_reserves = MockReserves {
                    base: cpamm_real_reserves.base - base_volume,
                    quote: cpamm_real_reserves.quote + quote_volume,
                };
            } else { // Buy against bonding curve, might require a state transition.
                let quote_volume_before_state_transition =
                    get_QUOTE_VIRTUAL_CEILING() - clamm_virtual_reserves.quote;
                // If a state transition, need to swap against CLAMM then CPAMM.
                if (quote_volume >= quote_volume_before_state_transition) {
                    results_in_state_transition = true;
                    base_volume = clamm_virtual_reserves.base - get_BASE_VIRTUAL_FLOOR();
                    let remaining_quote_volume =
                        quote_volume - quote_volume_before_state_transition;
                    cpamm_real_reserves = if (remaining_quote_volume > 0) {
                        let b_out_cpamm = cpamm_simple_swap_output_amount(
                            remaining_quote_volume,
                            SWAP_BUY,
                            pack_mock_reserves(base_cpamm_real_reserves_exact_transition())
                        );
                        pool_fee_base = get_bps_fee(b_out_cpamm, get_POOL_FEE_RATE_BPS());
                        let base_volume_cpamm = b_out_cpamm - pool_fee_base;
                        base_volume = base_volume + base_volume_cpamm;
                        MockReserves {
                            base: base_cpamm_real_reserves_exact_transition().base -
                                base_volume_cpamm,
                            quote: base_cpamm_real_reserves_exact_transition().quote +
                                remaining_quote_volume
                        }
                    } else { // Exact state transition
                        base_cpamm_real_reserves_exact_transition()
                    };
                    clamm_virtual_reserves = MockReserves { base: 0, quote: 0 };
                } else { // Buy against bonding curve, no state transition.
                    base_volume = cpamm_simple_swap_output_amount(
                        quote_volume,
                        SWAP_BUY,
                        pack_mock_reserves(setup_market_view.clamm_virtual_reserves)
                    );
                    clamm_virtual_reserves = MockReserves {
                        base: clamm_virtual_reserves.base - base_volume,
                        quote: clamm_virtual_reserves.quote + quote_volume,
                    };
                }
            };
            net_proceeds = base_volume;
            market_aptos_coin_balance = setup_market_view.aptos_coin_balance + quote_volume;
            market_emojicoin_balance = setup_market_view.emojicoin_balance - base_volume;
        };
        let avg_execution_price_q64 = ((quote_volume as u128) << 64) / (base_volume as u128);

        // Determine if ends in bonding curve, LP coins/instantaneous stats.
        let ends_in_bonding_curve = starts_in_bonding_curve && !results_in_state_transition;
        let lp_coin_supply;
        let total_quote_locked;
        let total_value_locked;
        let fully_diluted_value;
        let market_cap;
        if (ends_in_bonding_curve) {
            total_quote_locked = clamm_virtual_reserves.quote - get_QUOTE_VIRTUAL_FLOOR();
            lp_coin_supply = 0;
            total_value_locked = tvl_clamm(pack_mock_reserves(clamm_virtual_reserves));
            (fully_diluted_value, market_cap) = fdv_market_cap(
                pack_mock_reserves(clamm_virtual_reserves),
                get_BASE_VIRTUAL_CEILING(),
            );
        } else {
            total_quote_locked = cpamm_real_reserves.quote;
            lp_coin_supply = (get_LP_TOKENS_INITIAL() as u128);
            total_value_locked = (2 * (cpamm_real_reserves.quote as u128));
            (fully_diluted_value, market_cap) =
                fdv_market_cap(pack_mock_reserves(cpamm_real_reserves), get_EMOJICOIN_SUPPLY());
        };

        // Declare mock structs for general swap case test flow.
        let mock_swap = MockSwap {
            market_id: setup_swap.market_id,
            time: GENERAL_CASE_SWAP_TIME,
            market_nonce: setup_swap.market_nonce + 1,
            swapper: USER,
            input_amount: flow.input_amount,
            is_sell: flow.is_sell,
            integrator: INTEGRATOR,
            integrator_fee_rate_bps: INTEGRATOR_FEE_RATE_BPS,
            net_proceeds,
            base_volume,
            quote_volume,
            avg_execution_price_q64,
            integrator_fee,
            pool_fee: if (flow.is_sell) pool_fee_quote else pool_fee_base,
            starts_in_bonding_curve,
            results_in_state_transition,
        };
        let mock_market_view = MockMarketView {
            metadata: setup_market_view.metadata,
            sequence_info: MockSequenceInfo {
                nonce: setup_market_view.sequence_info.nonce + 1,
                last_bump_time: GENERAL_CASE_SWAP_TIME,
            },
            clamm_virtual_reserves,
            cpamm_real_reserves,
            lp_coin_supply,
            in_bonding_curve: ends_in_bonding_curve,
            cumulative_stats: MockCumulativeStats {
                base_volume: setup_market_view.cumulative_stats.base_volume + (base_volume as u128),
                quote_volume:
                    setup_market_view.cumulative_stats.quote_volume + (quote_volume as u128),
                integrator_fees:
                    setup_market_view.cumulative_stats.integrator_fees + (integrator_fee as u128),
                pool_fees_base: (pool_fee_base as u128),
                pool_fees_quote: (pool_fee_quote as u128),
                n_swaps: setup_market_view.cumulative_stats.n_swaps + 1,
                n_chat_messages: 0,
            },
            instantaneous_stats: MockInstantaneousStats {
                total_quote_locked,
                total_value_locked,
                market_cap,
                fully_diluted_value,
            },
            last_swap: MockLastSwap {
                is_sell: mock_swap.is_sell,
                avg_execution_price_q64,
                base_volume,
                quote_volume,
                nonce: mock_swap.market_nonce,
                time: mock_swap.time,
            },
            periodic_state_trackers: vectorize_periodic_state_tracker_base(
                MockPeriodicStateTracker {
                    start_time: setup_periodic_state_tracker.start_time,
                    period: 0,
                    open_price_q64: setup_periodic_state_tracker.open_price_q64,
                    high_price_q64: if
                        (avg_execution_price_q64 > setup_periodic_state_tracker.high_price_q64)
                        avg_execution_price_q64 else setup_periodic_state_tracker.high_price_q64,
                    low_price_q64: if
                        (avg_execution_price_q64 < setup_periodic_state_tracker.low_price_q64)
                        avg_execution_price_q64 else setup_periodic_state_tracker.low_price_q64,
                    close_price_q64: avg_execution_price_q64,
                    volume_base:
                        setup_periodic_state_tracker.volume_base + (base_volume as u128),
                    volume_quote:
                        setup_periodic_state_tracker.volume_quote + (quote_volume as u128),
                    integrator_fees:
                        setup_periodic_state_tracker.integrator_fees + (integrator_fee as u128),
                    pool_fees_base: (pool_fee_base as u128),
                    pool_fees_quote: (pool_fee_quote as u128),
                    n_swaps: setup_periodic_state_tracker.n_swaps + 1,
                    n_chat_messages: 0,
                    starts_in_bonding_curve: setup_periodic_state_tracker.starts_in_bonding_curve,
                    ends_in_bonding_curve,
                    tvl_to_lp_coin_ratio_start:
                        setup_periodic_state_tracker.tvl_to_lp_coin_ratio_start,
                    tvl_to_lp_coin_ratio_end: MockTVLtoLPCoinRatio {
                        tvl: total_value_locked,
                        lp_coins: (lp_coin_supply as u128),
                    },
                },
            ),
            aptos_coin_balance: market_aptos_coin_balance,
            emojicoin_balance: market_emojicoin_balance,
            emojicoin_lp_balance: (lp_coin_supply as u64),
        };
        let mock_registry_view = MockRegistryView {
            registry_address: setup_registry_view.registry_address,
            nonce: setup_registry_view.nonce + 1,
            last_bump_time: setup_registry_view.last_bump_time,
            n_markets: setup_registry_view.n_markets,
            cumulative_quote_volume: mock_market_view.cumulative_stats.quote_volume,
            total_quote_locked: (mock_market_view.instantaneous_stats.total_quote_locked as u128),
            total_value_locked: mock_market_view.instantaneous_stats.total_value_locked,
            market_cap: mock_market_view.instantaneous_stats.market_cap,
            fully_diluted_value: mock_market_view.instantaneous_stats.fully_diluted_value,
            cumulative_integrator_fees: mock_market_view.cumulative_stats.integrator_fees,
            cumulative_swaps: mock_market_view.cumulative_stats.n_swaps,
            cumulative_chat_messages: 0,
        };
        let mock_state = MockState {
            market_metadata: setup_state.market_metadata,
            state_metadata: MockStateMetadata {
                market_nonce: mock_swap.market_nonce,
                bump_time: GENERAL_CASE_SWAP_TIME,
                trigger: if (flow.is_sell) get_TRIGGER_SWAP_SELL() else get_TRIGGER_SWAP_BUY(),
            },
            clamm_virtual_reserves: mock_market_view.clamm_virtual_reserves,
            cpamm_real_reserves: mock_market_view.cpamm_real_reserves,
            lp_coin_supply: lp_coin_supply,
            cumulative_stats: mock_market_view.cumulative_stats,
            instantaneous_stats: mock_market_view.instantaneous_stats,
            last_swap: mock_market_view.last_swap,
        };

        // Assert simulated swap matches expected swap.
        assert_swap(mock_swap, simulated_swap);

        // Assert only two swap events emitted, and that final one matches simulated swap.
        let swap_events = emitted_events<Swap>();
        assert!(vector::length(&swap_events) == 2, 0);
        assert!(simulated_swap == vector::pop_back(&mut swap_events), 0);

        // Assert only one global state event emitted (from package publication).
        assert!(vector::length(&emitted_events<GlobalState>()) == 1, 0);

        // Assert no periodic state events emitted.
        assert!(vector::is_empty(&emitted_events<PeriodicState>()), 0);

        // Assert only 3 state events emitted: one from market registration, one from setup swap,
        // and one from general case swap.
        assert!(vector::length(&emitted_events<State>()) == 3, 0);

        // Assert coin balance updates for user and integrator.
        let (user_emojicoin_balance, user_apt_balance) = if (flow.is_sell) {
            (0, mock_swap.net_proceeds)
        } else {
            (mock_swap.net_proceeds, 0)
        };
        assert!(coin::balance<BlackCatEmojicoin>(USER) == user_emojicoin_balance, 0);
        assert!(coin::balance<AptosCoin>(USER) == user_apt_balance, 0);
        assert!(coin::balance<AptosCoin>(INTEGRATOR) == mock_swap.integrator_fee, 0);

        // Assert market and registry views, emitted state event.
        assert_market_view(
            mock_market_view,
            market_view<BlackCatEmojicoin, BlackCatEmojicoinLP>(@black_cat_market)
        );
        assert_registry_view(mock_registry_view, registry_view());
        assert_state(mock_state, vector::pop_back(&mut emitted_events<State>()));
    }

    public fun swap_setup_case_test_flow(
        flow: SwapSetupCaseTestFlow
    ) {
        // Assert simulated swap matches expected swap.
        assert_swap(flow.mock_swap, flow.simulated_swap);

        // Assert only one swap event emitted, and that it matches simulated swap.
        let swap_events = emitted_events<Swap>();
        assert!(vector::length(&swap_events) == 1, 0);
        assert!(flow.simulated_swap == vector::pop_back(&mut swap_events), 0);

        // Assert only one global state event emitted (from package publication).
        assert!(vector::length(&emitted_events<GlobalState>()) == 1, 0);

        // Assert no periodic state events emitted.
        assert!(vector::is_empty(&emitted_events<PeriodicState>()), 0);

        // Assert only two state events emitted: one from market registration and one from swap.
        assert!(vector::length(&emitted_events<State>()) == 2, 0);

        // Assert coin balance updates for user and integrator.
        assert!(coin::balance<BlackCatEmojicoin>(flow.user) == flow.mock_swap.net_proceeds, 0);
        assert!(coin::balance<AptosCoin>(flow.user) == 0, 0);
        assert!(coin::balance<AptosCoin>(flow.integrator) == flow.mock_swap.integrator_fee, 0);

        // Assert market and registry views, emitted state event.
        assert_market_view(
            flow.mock_market_view,
            market_view<BlackCatEmojicoin, BlackCatEmojicoinLP>(@black_cat_market)
        );
        assert_registry_view(flow.mock_registry_view, registry_view());
        assert_state(flow.mock_state, vector::pop_back(&mut emitted_events<State>()));
    }

    public fun swap_simulation_buy_cpamm(setup: SwapSimulationSetup): SwapSimulationResult {
        // Determine integrator fee and resultant quote volume.
        let integrator_fee = get_bps_fee(setup.input_amount, INTEGRATOR_FEE_RATE_BPS);
        let quote_volume = setup.input_amount - integrator_fee;

        // Get amount of base that comes out of CPAMM.
        let base_out_cpamm = cpamm_simple_swap_output_amount(
            quote_volume,
            SWAP_BUY,
            pack_mock_reserves(setup.cpamm_real_reserves),
        );

        // Determine pool fee, deducted from net proceeds.
        let pool_fee_base = get_bps_fee(base_out_cpamm, get_POOL_FEE_RATE_BPS());
        let base_volume = base_out_cpamm - pool_fee_base;

        // Return result.
        SwapSimulationResult {
            integrator_fee,
            pool_fee_base,
            pool_fee_quote: 0,
            net_proceeds: base_volume,
            base_volume,
            quote_volume,
            clamm_virtual_reserves: setup.clamm_virtual_reserves,
            cpamm_real_reserves: MockReserves {
                base: setup.cpamm_real_reserves.base - base_volume,
                quote: setup.cpamm_real_reserves.quote + quote_volume,
            },
            results_in_state_transition: false,
            market_aptos_coin_balance: setup.market_aptos_coin_balance + quote_volume,
            market_emojicoin_balance: setup.market_emojicoin_balance - base_volume,
        }
    }

    public fun swap_simulation_sell(setup: SwapSimulationSetup): SwapSimulationResult {
        // Get amount of quote that comes out of bonding curve for given base input.
        let quote_out_clamm = cpamm_simple_swap_output_amount(
            setup.input_amount,
            SWAP_SELL,
            pack_mock_reserves(if (setup.starts_in_bonding_curve)
                setup.clamm_virtual_reserves else setup.cpamm_real_reserves
            ),
        );
        // Calculate integrator fee and resultant pool fee.
        let integrator_fee = get_bps_fee(quote_out_clamm, INTEGRATOR_FEE_RATE_BPS);
        let pool_fee_quote = if (setup.starts_in_bonding_curve) {
            0
        } else {
            get_bps_fee(quote_out_clamm, get_POOL_FEE_RATE_BPS())
        };

        // Determine volume amounts, and amount of quote leaving the market.
        let quote_volume = quote_out_clamm - integrator_fee - pool_fee_quote;
        let base_volume = setup.input_amount;
        let net_proceeds = quote_volume;
        let quote_leaving_market = quote_out_clamm - pool_fee_quote;

        // Determine final reserves amounts, based on if sell starts in bonding curve.
        let (clamm_virtual_reserves, cpamm_real_reserves) = if (setup.starts_in_bonding_curve) {
            (
                MockReserves {
                    base: setup.clamm_virtual_reserves.base + base_volume,
                    quote: setup.clamm_virtual_reserves.quote - quote_leaving_market,
                },
                setup.cpamm_real_reserves,
            )
        } else {
            (
                setup.clamm_virtual_reserves,
                MockReserves {
                    base: setup.cpamm_real_reserves.base + base_volume,
                    quote: setup.cpamm_real_reserves.quote - quote_leaving_market,
                },
            )
        };

        // Pack, return result.
        SwapSimulationResult {
            integrator_fee,
            pool_fee_base: 0,
            pool_fee_quote,
            net_proceeds,
            base_volume,
            quote_volume,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            results_in_state_transition: false,
            market_aptos_coin_balance: setup.market_aptos_coin_balance - quote_leaving_market,
            market_emojicoin_balance: setup.market_emojicoin_balance + base_volume,
        }
    }

    public fun vectorize_periodic_state_tracker_base(
        base: MockPeriodicStateTracker
    ): vector<MockPeriodicStateTracker> {
        vector::map(vector[
            get_PERIOD_1M(),
            get_PERIOD_5M(),
            get_PERIOD_15M(),
            get_PERIOD_30M(),
            get_PERIOD_1H(),
            get_PERIOD_4H(),
            get_PERIOD_1D(),
        ], |period| {
            let periodic_state_tracker = copy base;
            periodic_state_tracker.period = period;
            periodic_state_tracker
        })
    }

    #[test] fun all_supported_emojis_under_10_bytes() {
        let max_symbol_length = (get_MAX_SYMBOL_LENGTH() as u64);
        vector::for_each(get_coin_symbol_emojis(), |bytes| {
            let emoji_as_string = utf8(bytes);
            assert!(string::length(&emoji_as_string) <= max_symbol_length, 0);
        });
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_INVALID_COIN_TYPES,
        location = emojicoin_dot_fun
    )] fun assert_valid_coin_types_bad_types() {
        init_package();
        init_market(vector[YELLOW_HEART]);
        assert_valid_coin_types<BadType, BadType>(@yellow_heart_market);
    }

    #[test] fun bps_fee_assorted() {
        assert!(get_BASIS_POINTS_PER_UNIT() == 10_000, 0);
        assert!(get_bps_fee(10_000, 5) == 5, 0);
        assert!(get_bps_fee(100_000, 20) == 200, 0);
        assert!(get_bps_fee(50_000, 40) == 200, 0);
        assert!(get_bps_fee(50_000, 1) == 5, 0);
    }

    #[test] fun chat_complex_emoji_sequences() {
        init_package();
        let emojis = vector[
            x"f09fa791e2808df09f9a80", // Astronaut.
            x"f09fa6b8f09f8fbee2808de29982efb88f", // Man superhero: medium-dark skin tone.
        ];

        // Verify neither supplemental chat emoji is supported before first market is registered.
        assert!(!vector::all(&emojis, |emoji_ref| { is_a_supported_chat_emoji(*emoji_ref) }), 0);

        // Register a market, verify both emojis supported in chat.
        init_market(vector[BLACK_CAT]);
        assert!(vector::all(&emojis, |emoji_ref| { is_a_supported_chat_emoji(*emoji_ref) }), 0);
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            emojis,
            vector[1, 0],
            @black_cat_market,
        );

        // Chat again with a longer message.
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            vector<vector<u8>> [
                x"f09f98b6", // Cat face.
                x"f09f98b7", // Cat face with tears of joy.
                x"f09f98b8", // Cat face with wry smile.
                x"f09f9088e2808de2ac9b", // Black cat.
                x"f09f9294", // Broken heart.
            ],
            vector[ 3, 0, 2, 2, 1, 4 ],
            @black_cat_market,
        );

        // Post a max length chat message.
        let emoji_indices_sequence = vector[];
        for (i in 0..get_MAX_CHAT_MESSAGE_LENGTH()) {
            vector::push_back(&mut emoji_indices_sequence, 0);
        };
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            vector<vector<u8>> [
                x"f09f9088e2808de2ac9b", // Black cat.
            ],
            emoji_indices_sequence,
            @black_cat_market,
        );

        // Assert the emitted chat events.
        let events_emitted = emitted_events<Chat>();
        let market_metadata = MockMarketMetadata {
            market_id: 1,
            market_address: @black_cat_market,
            emoji_bytes: BLACK_CAT,
        };
        assert_chat(
            MockChat {
                market_metadata,
                emit_time: 0,
                emit_market_nonce: 2,
                user: USER,
                message: utf8(x"f09fa6b8f09f8fbee2808de29982efb88ff09fa791e2808df09f9a80"),
                user_emojicoin_balance: 0,
                circulating_supply: 0,
                balance_as_fraction_of_circulating_supply_q64: 0,
            },
            *vector::borrow(&events_emitted, 0),
        );
        assert_chat(
            MockChat {
                market_metadata,
                emit_time: 0,
                emit_market_nonce: 3,
                user: USER,
                message: utf8(x"f09f9088e2808de2ac9bf09f98b6f09f98b8f09f98b8f09f98b7f09f9294"),
                user_emojicoin_balance: 0,
                circulating_supply: 0,
                balance_as_fraction_of_circulating_supply_q64: 0,
            },
            *vector::borrow(&events_emitted, 1),
        );
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_NOT_SUPPORTED_CHAT_EMOJI,
        location = emojicoin_dot_fun
    )] fun chat_message_invalid_emoji() {
        init_package();
        init_market(vector[BLACK_CAT]);

        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            vector<vector<u8>> [
                x"f09f98b7", // Cat face with tears of joy.
                x"f09f", // Invalid emoji.
            ],
            vector[ 0, 1],
            @black_cat_market,
        );
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_CHAT_MESSAGE_TOO_LONG,
        location = emojicoin_dot_fun
    )] fun chat_message_too_long() {
        init_package();
        init_market(vector[BLACK_CAT]);

        // Try to send a chat message that is one emoji too long.
        let emojis = vector[
            x"f09f8dba", // Beer mug.
        ];
        let emoji_indices_sequence = vector[];
        for (i in 0..(get_MAX_CHAT_MESSAGE_LENGTH() + 1)) {
            vector::push_back(&mut emoji_indices_sequence, 0);
        };
        chat<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            &get_signer(USER),
            emojis,
            emoji_indices_sequence,
            @black_cat_market,
        );
    }

    #[test] fun concatenation() {
        let base = utf8(b"base");
        let additional = utf8(b" additional");
        let concatenated = get_concatenation(base, additional);
        assert!(concatenated == utf8(b"base additional"), 0);
        // Ensure the base string was not mutated.
        assert!(base == utf8(b"base"), 0);
    }

    #[test] fun coin_factory_type_info() {
        let module_name = get_COIN_FACTORY_AS_BYTES();
        let emojicoin_struct = get_EMOJICOIN_STRUCT_NAME();
        let emojicoin_lp_struct = get_EMOJICOIN_LP_STRUCT_NAME();

        let emojicoin_type_info = type_info::type_of<CoinFactoryEmojicoin>();
        let lp_type_info = type_info::type_of<CoinFactoryEmojicoinLP>();

        assert!(@coin_factory == type_info::account_address(&emojicoin_type_info), 0);
        assert!(@coin_factory == type_info::account_address(&lp_type_info), 0);
        assert!(module_name == type_info::module_name(&emojicoin_type_info), 0);
        assert!(module_name == type_info::module_name(&lp_type_info), 0);
        assert!(emojicoin_struct == type_info::struct_name(&emojicoin_type_info), 0);
        assert!(emojicoin_lp_struct == type_info::struct_name(&lp_type_info), 0);
    }

    #[test] fun coin_names_and_symbols() {
        init_package();

        assert_coin_name_and_symbol<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            vector[BLACK_CAT],
            b"LP-1",
        );
        assert_coin_name_and_symbol<BlackHeartEmojicoin, BlackHeartEmojicoinLP>(
            vector[BLACK_HEART],
            b"LP-2",
        );
        assert_coin_name_and_symbol<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(
            vector[YELLOW_HEART],
            b"LP-3",
        );
    }

    #[test] fun cpamm_simple_swap_output_amount_buy_sell_all() {
        // Buy all base from start of bonding curve.
        let reserves = pack_reserves(get_BASE_VIRTUAL_CEILING(), get_QUOTE_VIRTUAL_FLOOR());
        let output = cpamm_simple_swap_output_amount(get_QUOTE_REAL_CEILING(), false, reserves);
        assert!(output == get_BASE_REAL_CEILING(), 0);
        // Sell all base to a bonding curve that is theoretically complete but has not transitioned.
        reserves = pack_reserves(get_BASE_VIRTUAL_FLOOR(), get_QUOTE_VIRTUAL_CEILING());
        output = cpamm_simple_swap_output_amount(get_BASE_REAL_CEILING(), true, reserves);
        assert!(output == get_QUOTE_REAL_CEILING(), 0);
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_SWAP_DIVIDE_BY_ZERO,
        location = emojicoin_dot_fun
    )] fun cpamm_simple_swap_output_amount_divide_by_zero() {
        cpamm_simple_swap_output_amount(0, true, pack_reserves(0, 16));
    }

    // Verify hard-coded test market addresses, derived from `@emojicoin_dot_fun` dev address.
    #[test] fun derived_test_market_addresses() {
        init_package();
        assert_test_market_address(vector[BLACK_CAT], @black_cat_market, true);
        assert_test_market_address(vector[BLACK_HEART], @black_heart_market, false);
        assert_test_market_address(vector[YELLOW_HEART], @yellow_heart_market, false);
    }

    #[test] fun get_publish_code_expected() {
        let market_address = @0xabcdef0123456789;
        let expected_metadata_bytecode = get_metadata_bytes();

        // Manually construct expected module bytecode.
        let split_module_bytes = get_split_module_bytes();
        let expected_module_bytecode = *vector::borrow(&split_module_bytes, 0);
        vector::append(&mut expected_module_bytecode, bcs::to_bytes(&market_address));
        vector::append(&mut expected_module_bytecode, *vector::borrow(&split_module_bytes, 1));

        // Compare expected vs actual bytecode.
        let (metadata_bytecode, module_bytecode) = get_publish_code(market_address);
        assert!(metadata_bytecode == expected_metadata_bytecode, 0);
        assert!(module_bytecode == expected_module_bytecode, 0);
    }

    #[test] fun init_module_comprehensive_state_assertion() {
        timestamp::set_time_has_started_for_testing(&get_signer(@aptos_framework));

        // Set init time to something other than a daily boundary.
        let one_day_and_one_hour = get_PERIOD_1D() + get_PERIOD_1H();
        timestamp::update_global_time_for_test(one_day_and_one_hour);

        // Initialize the module, assert state.
        init_module(&get_signer(@emojicoin_dot_fun));

        // Manually derive registry address from object seed, assert it.
        assert!(derived_registry_address() == registry_address(), 0);

        // Assert registry view.
        let registry_view = base_registry_view();
        registry_view.last_bump_time = get_PERIOD_1D();
        assert_registry_view(
            registry_view,
            registry_view(),
        );

        // Assert global state event emission.
        let global_state_events = emitted_events<GlobalState>();
        assert!(vector::length(&global_state_events) == 1, 0);
        let global_state = base_global_state();
        global_state.emit_time = one_day_and_one_hour;
        assert_global_state(
            global_state,
            vector::pop_back(&mut global_state_events),
        );
    }

    #[test] fun period_times() {
        let ms_per_s = get_MICROSECONDS_PER_SECOND();
        assert!(get_PERIOD_1M() == 60 * ms_per_s, 0);
        assert!(get_PERIOD_5M() == 5 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_15M() == 15 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_30M() == 30 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_1H() == 60 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_4H() == 4 * 60 * 60 * ms_per_s, 0);
        assert!(get_PERIOD_1D() == 24 * 60 * 60 * ms_per_s, 0);
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_ALREADY_REGISTERED,
        location = emojicoin_dot_fun
    )] fun register_market_already_registered() {
        init_package();
        register_market(&get_signer(USER), vector[BLACK_CAT], INTEGRATOR);
        register_market(&get_signer(USER), vector[BLACK_CAT], INTEGRATOR);
    }

    #[test] fun register_market_comprehensive_state_assertion() {

        // Initialize module with nonzero time that truncates for some periods.
        timestamp::set_time_has_started_for_testing(&get_signer(@aptos_framework));
        let one_day_and_one_hour = get_PERIOD_1D() + get_PERIOD_1H();
        let time = one_day_and_one_hour;
        timestamp::update_global_time_for_test(time);
        init_module(&get_signer(@emojicoin_dot_fun));

        // Assert registry view.
        let registry_view = base_registry_view();
        registry_view.nonce = 1;
        registry_view.last_bump_time = get_PERIOD_1D();
        registry_view.n_markets = 0;
        assert_registry_view(
            registry_view,
            registry_view(),
        );

        // Register simple market one second later, assert market state.
        let market_1_registration_time = time + get_MICROSECONDS_PER_SECOND();
        time = market_1_registration_time;
        timestamp::update_global_time_for_test(time);
        register_market(&get_signer(USER), vector[BLACK_CAT], INTEGRATOR);
        let market_view = base_market_view();
        let market_metadata_1 = MockMarketMetadata {
            market_id: 1,
            market_address: @black_cat_market,
            emoji_bytes: BLACK_CAT,
        };
        market_view.metadata = market_metadata_1;
        market_view.sequence_info.last_bump_time = time;
        apply_periodic_state_tracker_start_times(
            &mut market_view.periodic_state_trackers,
            PeriodicStateTrackerStartTimes {
                period_1D: get_PERIOD_1D(),
                period_4H: get_PERIOD_1D(),
                period_1H: one_day_and_one_hour,
                period_30M: one_day_and_one_hour,
                period_15M: one_day_and_one_hour,
                period_5M: one_day_and_one_hour,
                period_1M: one_day_and_one_hour,
            }
        );
        assert_market_view(
            market_view,
            market_view<BlackCatEmojicoin, BlackCatEmojicoinLP>(@black_cat_market),
        );

        // Assert registry view.
        registry_view.nonce = 2;
        registry_view.n_markets = 1;
        registry_view.fully_diluted_value = fdv_for_newly_registered_market();
        assert_registry_view(
            registry_view,
            registry_view(),
        );

        // Set next market registration time such that all periodic state trackers will truncate
        // to last period boundary.
        let market_2_registration_time = get_PERIOD_1D() + get_PERIOD_4H() + get_PERIOD_1H() +
            get_PERIOD_30M() + get_PERIOD_15M() + get_PERIOD_5M() + get_PERIOD_1M() + 1;
        let time = market_2_registration_time;
        let periodic_state_tracker_start_times = PeriodicStateTrackerStartTimes {
            period_1D: get_PERIOD_1D(),
            period_4H: get_PERIOD_1D() + get_PERIOD_4H(),
            period_1H: get_PERIOD_1D() + get_PERIOD_4H() + get_PERIOD_1H(),
            period_30M: get_PERIOD_1D() + get_PERIOD_4H() + get_PERIOD_1H() + get_PERIOD_30M(),
            period_15M: get_PERIOD_1D() + get_PERIOD_4H() + get_PERIOD_1H() + get_PERIOD_30M() +
                get_PERIOD_15M(),
            period_5M: get_PERIOD_1D() + get_PERIOD_4H() + get_PERIOD_1H() + get_PERIOD_30M() +
                get_PERIOD_15M() + get_PERIOD_5M(),
            period_1M: get_PERIOD_1D() + get_PERIOD_4H() + get_PERIOD_1H() + get_PERIOD_30M() +
                get_PERIOD_15M() + get_PERIOD_5M() + get_PERIOD_1M(),
        };
        timestamp::update_global_time_for_test(time);

        // Register new market, assert state.
        mint_aptos_coin_to(USER, get_MARKET_REGISTRATION_FEE());
        register_market_without_publish(&get_signer(USER), vector[BLACK_HEART], INTEGRATOR);
        let market_metadata_2 = MockMarketMetadata {
            market_id: 2,
            market_address: @black_heart_market,
            emoji_bytes: BLACK_HEART,
        };
        market_view.metadata = market_metadata_2;
        market_view.sequence_info.last_bump_time = time;
        market_view.cumulative_stats.integrator_fees = (get_MARKET_REGISTRATION_FEE() as u128);
        apply_periodic_state_tracker_start_times(
            &mut market_view.periodic_state_trackers,
            periodic_state_tracker_start_times,
        );
        vector::for_each_mut(&mut market_view.periodic_state_trackers, |e| {
            let periodic_state_tracker_ref_mut: &mut MockPeriodicStateTracker = e;
            periodic_state_tracker_ref_mut.integrator_fees =
                (get_MARKET_REGISTRATION_FEE() as u128);
        });
        assert_market_view(
            market_view,
            market_view<BlackHeartEmojicoin, BlackHeartEmojicoinLP>(@black_heart_market),
        );

        // Assert registry view.
        registry_view.nonce = 3;
        registry_view.n_markets = 2;
        registry_view.fully_diluted_value = 2 * fdv_for_newly_registered_market();
        registry_view.cumulative_integrator_fees = (get_MARKET_REGISTRATION_FEE() as u128);
        assert_registry_view(
            registry_view,
            registry_view(),
        );

        // Assert only one global state event emitted (from package publication).
        assert!(vector::length(&emitted_events<GlobalState>()) == 1, 0);

        // Assert no periodic state events emitted.
        assert!(vector::is_empty(&emitted_events<PeriodicState>()), 0);

        // Assert market registration events.
        let market_registration_1 = base_market_registration();
        market_registration_1.market_metadata = market_metadata_1;
        market_registration_1.time = market_1_registration_time;
        let market_registration_2 = base_market_registration();
        market_registration_2.market_metadata = market_metadata_2;
        market_registration_2.time = market_2_registration_time;
        market_registration_2.integrator_fee = get_MARKET_REGISTRATION_FEE();
        let market_registration_events = emitted_events<MarketRegistration>();
        assert!(vector::length(&market_registration_events) == 2, 0);
        assert_market_registration(
            market_registration_1,
            *vector::borrow(&market_registration_events, 0),
        );
        assert_market_registration(
            market_registration_2,
            *vector::borrow(&market_registration_events, 1),
        );

        // Assert state events.
        let state_1 = base_state();
        state_1.market_metadata = market_metadata_1;
        state_1.state_metadata.bump_time = market_1_registration_time;
        let state_2 = base_state();
        state_2.market_metadata = market_metadata_2;
        state_2.state_metadata.bump_time = market_2_registration_time;
        state_2.cumulative_stats.integrator_fees = (get_MARKET_REGISTRATION_FEE() as u128);
        let state_events = emitted_events<State>();
        assert!(vector::length(&market_registration_events) == 2, 0);
        assert_state(state_1, *vector::borrow(&state_events, 0));
        assert_state(state_2, *vector::borrow(&state_events, 1));

    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_UNABLE_TO_PAY_MARKET_REGISTRATION_FEE,
        location = emojicoin_dot_fun
    )] fun register_market_unable_to_pay_market_registration_fee() {
        init_package();
        register_market(&get_signer(USER), vector[BLACK_CAT], INTEGRATOR);
        register_market_without_publish(&get_signer(USER), vector[BLACK_HEART], INTEGRATOR);
    }

    #[test] fun register_market_with_compound_emoji_sequence() {
        init_package();
        let emojis = vector[
            x"e29aa1",         // High voltage.
            x"f09f96a5efb88f", // Desktop computer.
        ];
        let concatenated_bytes = verified_symbol_emoji_bytes(emojis);

        // Verify market is not already registered, register, then verify is registered.
        assert!(market_metadata_by_emoji_bytes(concatenated_bytes) == option::none(), 0);
        init_market(emojis);
        let market_metadata =
            option::destroy_some(market_metadata_by_emoji_bytes(concatenated_bytes));
        let (_, _, market_metadata_byes) = unpack_market_metadata(market_metadata);
        assert!(market_metadata_byes == concatenated_bytes, 0);
    }

    #[test] fun supported_symbol_emojis() {
        init_package();
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
            assert!(is_a_supported_symbol_emoji(bytes), 0);
        });

        // Test unsupported emojis.
        assert!(!is_a_supported_symbol_emoji(x"0000"), 0);
        assert!(!is_a_supported_symbol_emoji(x"fe0f"), 0);
        assert!(!is_a_supported_symbol_emoji(x"1234"), 0);
        assert!(!is_a_supported_symbol_emoji(x"f0fabcdefabcdeff0f"), 0);
        assert!(!is_a_supported_symbol_emoji(x"f0f00dcafef0"), 0);
        // Minimally qualified "head shaking horizontally".
        assert!(!is_a_supported_symbol_emoji(x"f09f9982e2808de28694"), 0);

        // Verify a supported emoji, add invalid data to it, then verify it is no longer allowed.
        assert!(is_a_supported_symbol_emoji(x"e29d97"), 0);
        assert!(!is_a_supported_symbol_emoji(x"e29d97ff"), 0);
        assert!(!is_a_supported_symbol_emoji(x"ffe29d97"), 0);
    }

    #[test] fun simple_buy_amounts() {
        // Check quote input amount as a fraction of the amount required to leave bonding curve.
        assert!(SIMPLE_BUY_INPUT_AMOUNT == get_QUOTE_REAL_CEILING() / SIMPLE_BUY_QUOTE_DIVISOR, 0);

        // Check nonzero integrator fee requires integer truncation.
        assert!(
            (SIMPLE_BUY_INPUT_AMOUNT * (SIMPLE_BUY_INTEGRATOR_FEE_RATE_BPS as u64))
                % (get_BASIS_POINTS_PER_UNIT() as u64) != 0,
            0
        );
        let integrator_fee =
            get_bps_fee(SIMPLE_BUY_INPUT_AMOUNT, SIMPLE_BUY_INTEGRATOR_FEE_RATE_BPS);
        assert!(integrator_fee > 0, 0);

        // Get input amount to CLAMM after integrator fee assessed on quote input.
        let input_amount = SIMPLE_BUY_INPUT_AMOUNT - integrator_fee;

        // Define terms via simple CPAMM equation from blackpaper.
        let b_0 = (get_BASE_VIRTUAL_CEILING() as u128);
        let q_in = (input_amount as u128);
        let q_0 = (get_QUOTE_VIRTUAL_FLOOR() as u128);

        let numerator = b_0 * q_in;
        let denominator = q_0 + q_in;

        // Assert that rounding will indeed take place, such that output will be truncated and
        // rounding effects will be assumed by swapper.
        assert!(numerator % denominator != 0, 0);

        // Determine swap input amount for follow up swap with general fee amount such that follow
        // up swap will result in an exact state transition.
        let input_amount = swap_general_case_follow_up_input_amount_to_trigger_state_transition();
        let integrator_fee_rate = get_bps_fee(input_amount, INTEGRATOR_FEE_RATE_BPS);
        let quote_to_clamm = input_amount - integrator_fee_rate;
        let quote_to_transition = get_QUOTE_VIRTUAL_CEILING() -
            base_market_view_simple_buy().clamm_virtual_reserves.quote;
        assert!(quote_to_clamm == quote_to_transition, 0);
    }

    #[test] fun swap_exact_transition() {
        swap_setup_case_test_flow(SwapSetupCaseTestFlow {
            simulated_swap: init_package_then_exact_transition(),
            mock_swap: base_swap_exact_transition(),
            user: EXACT_TRANSITION_USER,
            integrator: EXACT_TRANSITION_INTEGRATOR,
            mock_market_view: base_market_view_exact_transition(),
            mock_registry_view: base_registry_view_exact_transition(),
            mock_state: base_state_exact_transition(),
        })
    }

    #[test] fun swap_exact_state_transition_then_buy_large() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: false,
            is_sell: false,
            input_amount: get_QUOTE_REAL_CEILING() / 2,
        })
    }

    #[test] fun swap_exact_state_transition_then_buy_small() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: false,
            is_sell: false,
            input_amount: get_QUOTE_REAL_CEILING() / 100,
        })
    }

    #[test] fun swap_exact_transition_then_sell_all() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: false,
            is_sell: true,
            input_amount: base_swap_exact_transition().net_proceeds,
        })
    }

    #[test] fun swap_exact_transition_then_sell_half() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: false,
            is_sell: true,
            input_amount: base_swap_exact_transition().net_proceeds / 2,
        })
    }

    #[test] fun swap_initializes_coin_capabilities() {
        init_package();
        let emoji_bytes = vector[YELLOW_HEART];
        init_market_and_coins_via_swap<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(emoji_bytes);
        assert!(
            exists_lp_coin_capabilities<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(
                @yellow_heart_market
            ),
            0,
        );
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_NO_MARKET,
        location = emojicoin_dot_fun::emojicoin_dot_fun,
    )] fun simulate_swap_no_market() {
        simulate_swap(
            @0x0,
            USER,
            1,
            SWAP_SELL,
            INTEGRATOR,
            INTEGRATOR_FEE_RATE_BPS,
        );
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_SWAP_INPUT_ZERO,
        location = emojicoin_dot_fun::emojicoin_dot_fun,
    )] fun simulate_swap_no_size() {
        init_package_then_simple_buy();
        simulate_swap(
            base_market_metadata().market_address,
            USER,
            0,
            SWAP_SELL,
            INTEGRATOR,
            INTEGRATOR_FEE_RATE_BPS,
        );
    }

    #[test, expected_failure(
        abort_code = 65542, // 0x1 << 16 + 6, error:invalid_argument(EINSUFFICIENT_BALANCE)
        location = aptos_framework::coin,
    )] fun swap_no_base() {
        init_package_then_simple_buy();
        swap<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            base_market_metadata().market_address,
            &get_signer(USER),
            1,
            SWAP_SELL,
            INTEGRATOR,
            INTEGRATOR_FEE_RATE_BPS,
        );
    }

    #[test, expected_failure(
        abort_code = emojicoin_dot_fun::emojicoin_dot_fun::E_NO_MARKET,
        location = emojicoin_dot_fun::emojicoin_dot_fun,
    )] fun swap_no_market() {
        swap<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            @0x0,
            &get_signer(USER),
            1,
            SWAP_SELL,
            INTEGRATOR,
            INTEGRATOR_FEE_RATE_BPS,
        );
    }

    #[test, expected_failure(
        abort_code = 65542, // 0x1 << 16 + 6, error:invalid_argument(EINSUFFICIENT_BALANCE)
        location = aptos_framework::coin,
    )] fun swap_no_quote() {
        init_package_then_simple_buy();
        swap<BlackCatEmojicoin, BlackCatEmojicoinLP>(
            base_market_metadata().market_address,
            &get_signer(USER),
            1,
            SWAP_BUY,
            INTEGRATOR,
            INTEGRATOR_FEE_RATE_BPS,
        );
    }

    #[test] fun swap_simple_buy() {
        swap_setup_case_test_flow(SwapSetupCaseTestFlow {
            simulated_swap: init_package_then_simple_buy(),
            mock_swap: base_swap_simple_buy(),
            user: SIMPLE_BUY_USER,
            integrator: SIMPLE_BUY_INTEGRATOR,
            mock_market_view: base_market_view_simple_buy(),
            mock_registry_view: base_registry_view_simple_buy(),
            mock_state: base_state_simple_buy(),
        })
    }

    #[test] fun swap_simple_buy_then_sell_back_all() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: true,
            is_sell: true,
            input_amount: base_swap_simple_buy().net_proceeds,
        })
    }

    #[test] fun swap_simple_buy_then_sell_back_half() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: true,
            is_sell: true,
            input_amount: base_swap_simple_buy().net_proceeds / 2,
        })
    }

    #[test] fun swap_simple_buy_then_buy_to_exact_state_transition() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: true,
            is_sell: false,
            input_amount: swap_general_case_follow_up_input_amount_to_trigger_state_transition(),
        });
        let market_view = market_view<BlackCatEmojicoin, BlackCatEmojicoinLP>(@black_cat_market);
        let (
            _,
            _,
            clamm_virtual_reserves,
            cpamm_real_reserves,
            lp_coin_supply,
            in_bonding_curve,
            _,
            _,
            _,
            _,
            _,
            _,
            emojicoin_lp_balance,
        ) = unpack_market_view(market_view);
        assert_reserves(
            base_market_view_exact_transition().clamm_virtual_reserves,
            clamm_virtual_reserves,
        );
        assert_reserves(
            base_market_view_exact_transition().cpamm_real_reserves,
            cpamm_real_reserves,
        );
        assert!((lp_coin_supply as u64) == get_LP_TOKENS_INITIAL(), 0);
        assert!(!in_bonding_curve, 0);
        assert!(emojicoin_lp_balance == get_LP_TOKENS_INITIAL(), 0);
    }

    #[test] fun swap_simple_buy_then_buy_past_state_transition_large() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: true,
            is_sell: false,
            input_amount: swap_general_case_follow_up_input_amount_to_trigger_state_transition() +
                get_QUOTE_REAL_CEILING() / 10,
        });
    }

    #[test] fun swap_simple_buy_then_buy_past_state_transition_small() {
        swap_general_case_test_flow(SwapGeneralCaseTestFlow {
            setup_is_simple_buy: true,
            is_sell: false,
            input_amount: swap_general_case_follow_up_input_amount_to_trigger_state_transition() +
                1,
        });
    }

    #[test] fun valid_coin_types_all_invalid() {
        // Duplicate types should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoin, BlackCatEmojicoin>(@emojicoin_dot_fun), 0);
        // Duplicate LP types should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoinLP, BlackCatEmojicoinLP>(@emojicoin_dot_fun), 0);
        // A bad Emojicoin type should be invalid.
        assert!(!valid_coin_types<BadType, BlackCatEmojicoinLP>(@emojicoin_dot_fun), 0);
        // A bad EmojicoinLP type should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoin, BadType>(@emojicoin_dot_fun), 0);
        // Backwards coin types that are otherwise valid should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoinLP, BlackCatEmojicoin>(@emojicoin_dot_fun), 0);
        // A market address that doesn't match the types should be invalid.
        assert!(!valid_coin_types<BlackCatEmojicoin, BlackCatEmojicoinLP>(@0xc1de), 0);
    }

    #[test] fun valid_coin_types_all_valid() {
        assert!(
            valid_coin_types<YellowHeartEmojicoin, YellowHeartEmojicoinLP>(@yellow_heart_market) &&
            valid_coin_types<BlackHeartEmojicoin, BlackHeartEmojicoinLP>(@black_heart_market) &&
            valid_coin_types<BlackCatEmojicoin, BlackCatEmojicoinLP>(@black_cat_market),
            0
        );
    }
}
