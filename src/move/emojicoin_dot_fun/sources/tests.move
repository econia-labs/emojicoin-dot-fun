#[test_only] module emojicoin_dot_fun::tests {

    use aptos_framework::account::{create_signer_for_test as get_signer};
    use aptos_framework::aggregator_v2::read_snapshot;
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
        assert_valid_coin_types_test_only as assert_valid_coin_types,
        chat,
        cpamm_simple_swap_output_amount_test_only as cpamm_simple_swap_output_amount,
        exists_lp_coin_capabilities,
        get_BASE_REAL_CEILING,
        get_BASE_VIRTUAL_CEILING,
        get_BASE_VIRTUAL_FLOOR,
        get_COIN_FACTORY_AS_BYTES,
        get_EMOJICOIN_STRUCT_NAME,
        get_EMOJICOIN_LP_NAME_SUFFIX,
        get_EMOJICOIN_LP_STRUCT_NAME,
        get_EMOJICOIN_LP_SYMBOL_PREFIX,
        get_EMOJICOIN_NAME_SUFFIX,
        get_EMOJICOIN_SUPPLY,
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
        get_QUOTE_REAL_CEILING,
        get_QUOTE_VIRTUAL_CEILING,
        get_QUOTE_VIRTUAL_FLOOR,
        get_REGISTRY_NAME,
        get_TRIGGER_MARKET_REGISTRATION,
        get_TRIGGER_PACKAGE_PUBLICATION,
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
        swap,
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

    struct TestChat has copy, drop, store {
        market_metadata: TestMarketMetadata,
        emit_time: u64,
        emit_market_nonce: u64,
        user: address,
        message: String,
        user_emojicoin_balance: u64,
        circulating_supply: u64,
        balance_as_fraction_of_circulating_supply_q64: u128,
    }

    struct TestCumulativeStats has copy, drop, store {
        base_volume: u128,
        quote_volume: u128,
        integrator_fees: u128,
        pool_fees_base: u128,
        pool_fees_quote: u128,
        n_swaps: u64,
        n_chat_messages: u64,
    }

    struct TestGlobalState has copy, drop, store {
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

    struct TestInstantaneousStats has copy, drop, store {
        total_quote_locked: u64,
        total_value_locked: u128,
        market_cap: u128,
        fully_diluted_value: u128,
    }

    struct TestLastSwap has copy, drop, store {
        is_sell: bool,
        avg_execution_price_q64: u128,
        base_volume: u64,
        quote_volume: u64,
        nonce: u64,
        time: u64,
    }

    struct TestMarketMetadata has copy, drop, store {
        market_id: u64,
        market_address: address,
        emoji_bytes: vector<u8>,
    }

    struct TestMarketRegistration has copy, drop, store {
        market_metadata: TestMarketMetadata,
        time: u64,
        registrant: address,
        integrator: address,
        integrator_fee: u64,
    }

    struct TestMarketView has copy, drop, store {
        metadata: TestMarketMetadata,
        sequence_info: TestSequenceInfo,
        clamm_virtual_reserves: TestReserves,
        cpamm_real_reserves: TestReserves,
        lp_coin_supply: u128,
        in_bonding_curve: bool,
        cumulative_stats: TestCumulativeStats,
        instantaneous_stats: TestInstantaneousStats,
        last_swap: TestLastSwap,
        periodic_state_trackers: vector<TestPeriodicStateTracker>,
        aptos_coin_balance: u64,
        emojicoin_balance: u64,
        emojicoin_lp_balance: u64,
    }

    struct TestPeriodicState has copy, drop, store {
        market_metadata: TestMarketMetadata,
        periodic_state_metadata: TestPeriodicStateMetadata,
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

    struct TestPeriodicStateTracker has copy, drop, store {
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
        tvl_to_lp_coin_ratio_start: TestTVLtoLPCoinRatio,
        tvl_to_lp_coin_ratio_end: TestTVLtoLPCoinRatio,
    }

    struct TestPeriodicStateMetadata has copy, drop, store {
        start_time: u64,
        period: u64,
        emit_time: u64,
        emit_market_nonce: u64,
        trigger: u8,
    }

    struct TestRegistryView has copy, drop, store {
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

    struct TestTVLtoLPCoinRatio has copy, drop, store {
        tvl: u128,
        lp_coins: u128,
    }

    struct TestReserves has copy, drop, store {
        base: u64,
        quote: u64,
    }

    struct TestSequenceInfo has copy, drop, store {
        nonce: u64,
        last_bump_time: u64,
    }

    // Test market emoji bytes.
    const BLACK_CAT: vector<u8> = x"f09f9088e2808de2ac9b";
    const BLACK_HEART: vector<u8> = x"f09f96a4";
    const YELLOW_HEART: vector<u8> = x"f09f929b";

    const SWAP_BUY: bool = false;
    const SWAP_SELL: bool = true;

    const USER: address = @0xaaaaa;
    const INTEGRATOR: address = @0xbbbbb;

    public fun address_for_registered_market_by_emoji_bytes(
        emoji_bytes: vector<vector<u8>>,
    ): address {
        let (_, market_address, _) = unpack_market_metadata(
            metadata_for_registered_market_by_emoji_bytes(emoji_bytes)
        );
        market_address
    }

    public fun assert_chat(
        test_chat: TestChat,
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
        assert_market_metadata(test_chat.market_metadata, market_metadata);
        assert!(emit_time == test_chat.emit_time, 0);
        assert!(emit_market_nonce == test_chat.emit_market_nonce, 0);
        assert!(user == test_chat.user, 0);
        assert!(message == test_chat.message, 0);
        assert!(user_emojicoin_balance == test_chat.user_emojicoin_balance, 0);
        assert!(circulating_supply == test_chat.circulating_supply, 0);
        assert!(
            balance_as_fraction_of_circulating_supply_q64 ==
                test_chat.balance_as_fraction_of_circulating_supply_q64,
            0
        );
    }

    public fun assert_market_metadata(
        test_metadata: TestMarketMetadata,
        metadata: MarketMetadata,
    ) {
        let (market_id, market_address, emoji_bytes) = unpack_market_metadata(metadata);
        assert!(market_id == test_metadata.market_id, 0);
        assert!(market_address == test_metadata.market_address, 0);
        assert!(emoji_bytes == test_metadata.emoji_bytes, 0);
    }

    public fun assert_market_registration(
        test_market_registration: TestMarketRegistration,
        market_registration: MarketRegistration,
    ) {
        let (
            market_metadata,
            time,
            registrant,
            integrator,
            integrator_fee,
        ) = unpack_market_registration(market_registration);
        assert_market_metadata(test_market_registration.market_metadata, market_metadata);
        assert!(time == test_market_registration.time, 0);
        assert!(registrant == test_market_registration.registrant, 0);
        assert!(integrator == test_market_registration.integrator, 0);
        assert!(integrator_fee == test_market_registration.integrator_fee, 0);
    }

    public fun assert_market_view(
        test_market_view: TestMarketView,
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
        assert_market_metadata(test_market_view.metadata, metadata);
        assert_sequence_info(test_market_view.sequence_info, sequence_info);
        assert_reserves(test_market_view.clamm_virtual_reserves, clamm_virtual_reserves);
        assert_reserves(test_market_view.cpamm_real_reserves, cpamm_real_reserves);
        assert!(lp_coin_supply == test_market_view.lp_coin_supply, 0);
        assert!(in_bonding_curve == test_market_view.in_bonding_curve, 0);
        assert_cumulative_stats(test_market_view.cumulative_stats, cumulative_stats);
        assert_instaneous_stats(test_market_view.instantaneous_stats, instantaneous_stats);
        assert_last_swap(test_market_view.last_swap, last_swap);
        assert!(vector::length(&periodic_state_trackers) ==
            vector::length(&test_market_view.periodic_state_trackers), 0);
        for (i in 0..vector::length(&periodic_state_trackers)) {
            assert_periodic_state_tracker(
                *vector::borrow(&test_market_view.periodic_state_trackers, i),
                *vector::borrow(&periodic_state_trackers, i),
            );
        };
        assert!(aptos_coin_balance == test_market_view.aptos_coin_balance, 0);
        assert!(emojicoin_balance == test_market_view.emojicoin_balance, 0);
        assert!(emojicoin_lp_balance == test_market_view.emojicoin_lp_balance, 0);
    }

    public fun assert_registry_view(
        test_registry_view: TestRegistryView,
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
        assert!(registry_address == test_registry_view.registry_address, 0);
        assert!(nonce == test_registry_view.nonce, 0);
        assert!(last_bump_time == test_registry_view.last_bump_time, 0);
        assert!(n_markets == test_registry_view.n_markets, 0);
        assert!(read_snapshot(&cumulative_quote_volume)
            == test_registry_view.cumulative_quote_volume, 0);
        assert!(read_snapshot(&total_quote_locked) == test_registry_view.total_quote_locked, 0);
        assert!(read_snapshot(&total_value_locked) == test_registry_view.total_value_locked, 0);
        assert!(read_snapshot(&market_cap) == test_registry_view.market_cap, 0);
        assert!(read_snapshot(&fully_diluted_value) == test_registry_view.fully_diluted_value, 0);
        assert!(read_snapshot(&cumulative_integrator_fees)
            == test_registry_view.cumulative_integrator_fees, 0);
        assert!(read_snapshot(&cumulative_swaps) == test_registry_view.cumulative_swaps, 0);
        assert!(read_snapshot(&cumulative_chat_messages)
            == test_registry_view.cumulative_chat_messages, 0);
    }

    public fun assert_global_state(
        test_global_state: TestGlobalState,
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
        assert!(emit_time == test_global_state.emit_time, 0);
        assert!(registry_nonce == test_global_state.registry_nonce, 0);
        assert!(trigger == test_global_state.trigger, 0);
        assert!(read_snapshot(&cumulative_quote_volume)
            == test_global_state.cumulative_quote_volume, 0);
        assert!(read_snapshot(&total_quote_locked) == test_global_state.total_quote_locked, 0);
        assert!(read_snapshot(&total_value_locked) == test_global_state.total_value_locked, 0);
        assert!(read_snapshot(&market_cap) == test_global_state.market_cap, 0);
        assert!(read_snapshot(&fully_diluted_value) == test_global_state.fully_diluted_value, 0);
        assert!(read_snapshot(&cumulative_integrator_fees)
            == test_global_state.cumulative_integrator_fees, 0);
        assert!(read_snapshot(&cumulative_swaps) == test_global_state.cumulative_swaps, 0);
        assert!(read_snapshot(&cumulative_chat_messages)
            == test_global_state.cumulative_chat_messages, 0);
    }

    public fun assert_periodic_state(
        test_periodic_state: TestPeriodicState,
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
        assert_market_metadata(test_periodic_state.market_metadata, market_metadata);
        assert_periodic_state_metadata(
            test_periodic_state.periodic_state_metadata,
            periodic_state_metadata,
        );
        assert!(open_price_q64 == test_periodic_state.open_price_q64, 0);
        assert!(high_price_q64 == test_periodic_state.high_price_q64, 0);
        assert!(low_price_q64 == test_periodic_state.low_price_q64, 0);
        assert!(close_price_q64 == test_periodic_state.close_price_q64, 0);
        assert!(volume_base == test_periodic_state.volume_base, 0);
        assert!(volume_quote == test_periodic_state.volume_quote, 0);
        assert!(integrator_fees == test_periodic_state.integrator_fees, 0);
        assert!(pool_fees_base == test_periodic_state.pool_fees_base, 0);
        assert!(pool_fees_quote == test_periodic_state.pool_fees_quote, 0);
        assert!(n_swaps == test_periodic_state.n_swaps, 0);
        assert!(n_chat_messages == test_periodic_state.n_chat_messages, 0);
        assert!(starts_in_bonding_curve == test_periodic_state.starts_in_bonding_curve, 0);
        assert!(ends_in_bonding_curve == test_periodic_state.ends_in_bonding_curve, 0);
        assert!(tvl_per_lp_coin_growth_q64 == test_periodic_state.tvl_per_lp_coin_growth_q64, 0);
    }

    public fun assert_periodic_state_metadata(
        test_periodic_state_metadata: TestPeriodicStateMetadata,
        periodic_state_metadata: PeriodicStateMetadata,
    ) {
        let (
            start_time,
            period,
            emit_time,
            emit_market_nonce,
            trigger,
        ) = unpack_periodic_state_metadata(periodic_state_metadata);
        assert!(start_time == test_periodic_state_metadata.start_time, 0);
        assert!(period == test_periodic_state_metadata.period, 0);
        assert!(emit_time == test_periodic_state_metadata.emit_time, 0);
        assert!(emit_market_nonce == test_periodic_state_metadata.emit_market_nonce, 0);
        assert!(trigger == test_periodic_state_metadata.trigger, 0);
    }

    public fun assert_periodic_state_tracker(
        test_periodic_state_tracker: TestPeriodicStateTracker,
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
        assert!(start_time == test_periodic_state_tracker.start_time, 0);
        assert!(period == test_periodic_state_tracker.period, 0);
        assert!(open_price_q64 == test_periodic_state_tracker.open_price_q64, 0);
        assert!(high_price_q64 == test_periodic_state_tracker.high_price_q64, 0);
        assert!(low_price_q64 == test_periodic_state_tracker.low_price_q64, 0);
        assert!(close_price_q64 == test_periodic_state_tracker.close_price_q64, 0);
        assert!(volume_base == test_periodic_state_tracker.volume_base, 0);
        assert!(volume_quote == test_periodic_state_tracker.volume_quote, 0);
        assert!(integrator_fees == test_periodic_state_tracker.integrator_fees, 0);
        assert!(pool_fees_base == test_periodic_state_tracker.pool_fees_base, 0);
        assert!(pool_fees_quote == test_periodic_state_tracker.pool_fees_quote, 0);
        assert!(n_swaps == test_periodic_state_tracker.n_swaps, 0);
        assert!(n_chat_messages == test_periodic_state_tracker.n_chat_messages, 0);
        assert!(starts_in_bonding_curve == test_periodic_state_tracker.starts_in_bonding_curve, 0);
        assert!(ends_in_bonding_curve == test_periodic_state_tracker.ends_in_bonding_curve, 0);
        assert_tvl_to_lp_coin_ratio(
            test_periodic_state_tracker.tvl_to_lp_coin_ratio_start,
            tvl_to_lp_coin_ratio_start,
        );
        assert_tvl_to_lp_coin_ratio(
            test_periodic_state_tracker.tvl_to_lp_coin_ratio_end,
            tvl_to_lp_coin_ratio_end,
        );
    }

    public fun assert_reserves(
        test_reserves: TestReserves,
        reserves: Reserves,
    ) {
        let (base, quote) = unpack_reserves(reserves);
        assert!(base == test_reserves.base, 0);
        assert!(quote == test_reserves.quote, 0);
    }

    public fun assert_sequence_info(
        test_sequence_info: TestSequenceInfo,
        sequence_info: SequenceInfo,
    ) {
        let (nonce, last_bump_time) = unpack_sequence_info(sequence_info);
        assert!(nonce == test_sequence_info.nonce, 0);
        assert!(last_bump_time == test_sequence_info.last_bump_time, 0);
    }

    public fun assert_tvl_to_lp_coin_ratio(
        test_tvl_to_lp_coin_ratio: TestTVLtoLPCoinRatio,
        tvl_to_lp_coin_ratio: TVLtoLPCoinRatio,
    ) {
        let (tvl, lp_coins) = unpack_tvl_to_lp_coin_ratio(tvl_to_lp_coin_ratio);
        assert!(tvl == test_tvl_to_lp_coin_ratio.tvl, 0);
        assert!(lp_coins == test_tvl_to_lp_coin_ratio.lp_coins, 0);
    }

    public fun assert_cumulative_stats(
        test_cumulative_stats: TestCumulativeStats,
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
        assert!(base_volume == test_cumulative_stats.base_volume, 0);
        assert!(quote_volume == test_cumulative_stats.quote_volume, 0);
        assert!(integrator_fees == test_cumulative_stats.integrator_fees, 0);
        assert!(pool_fees_base == test_cumulative_stats.pool_fees_base, 0);
        assert!(pool_fees_quote == test_cumulative_stats.pool_fees_quote, 0);
        assert!(n_swaps == test_cumulative_stats.n_swaps, 0);
        assert!(n_chat_messages == test_cumulative_stats.n_chat_messages, 0);
    }

    public fun assert_instaneous_stats(
        test_instaneous_stats: TestInstantaneousStats,
        instaneous_stats: InstantaneousStats,
    ) {
        let (
            total_quote_locked,
            total_value_locked,
            market_cap,
            fully_diluted_value,
        ) = unpack_instantaneous_stats(instaneous_stats);
        assert!(total_quote_locked == test_instaneous_stats.total_quote_locked, 0);
        assert!(total_value_locked == test_instaneous_stats.total_value_locked, 0);
        assert!(market_cap == test_instaneous_stats.market_cap, 0);
        assert!(fully_diluted_value == test_instaneous_stats.fully_diluted_value, 0);
    }

    public fun assert_last_swap(
        test_last_swap: TestLastSwap,
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
        assert!(is_sell == test_last_swap.is_sell, 0);
        assert!(avg_execution_price_q64 == test_last_swap.avg_execution_price_q64, 0);
        assert!(base_volume == test_last_swap.base_volume, 0);
        assert!(quote_volume == test_last_swap.quote_volume, 0);
        assert!(nonce == test_last_swap.nonce, 0);
        assert!(time == test_last_swap.time, 0);
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
        periodic_state_trackers_ref_mut: &mut vector<TestPeriodicStateTracker>,
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

    public fun base_global_state(): TestGlobalState {
        TestGlobalState {
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

    public fun base_market_metadata(): TestMarketMetadata {
        TestMarketMetadata {
            market_id: 1,
            market_address: @0x0,
            emoji_bytes: vector[],
        }
    }

    public fun base_market_view(): TestMarketView {
        TestMarketView {
            metadata: base_market_metadata(),
            sequence_info: TestSequenceInfo {
                nonce: 1,
                last_bump_time: 0,
            },
            clamm_virtual_reserves: TestReserves {
                base: get_BASE_VIRTUAL_CEILING(),
                quote: get_QUOTE_VIRTUAL_FLOOR(),
            },
            cpamm_real_reserves: TestReserves {
                base: 0,
                quote: 0,
            },
            lp_coin_supply: 0,
            in_bonding_curve: true,
            cumulative_stats: TestCumulativeStats {
                base_volume: 0,
                quote_volume: 0,
                integrator_fees: 0,
                pool_fees_base: 0,
                pool_fees_quote: 0,
                n_swaps: 0,
                n_chat_messages: 0,
            },
            instantaneous_stats: TestInstantaneousStats {
                total_quote_locked: 0,
                total_value_locked: 0,
                market_cap: 0,
                fully_diluted_value: fdv_for_newly_registered_market(),
            },
            last_swap: TestLastSwap {
                is_sell: false,
                avg_execution_price_q64: 0,
                base_volume: 0,
                quote_volume: 0,
                nonce: 0,
                time: 0,
            },
            periodic_state_trackers:
                vectorize_periodic_state_tracker_base(base_periodic_state_tracker()),
            aptos_coin_balance: 0,
            emojicoin_balance: get_EMOJICOIN_SUPPLY(),
            emojicoin_lp_balance: 0,
        }
    }

    public fun base_periodic_state_tracker(): TestPeriodicStateTracker {
        TestPeriodicStateTracker {
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
            tvl_to_lp_coin_ratio_start: TestTVLtoLPCoinRatio {
                tvl: 0,
                lp_coins: 0,
            },
            tvl_to_lp_coin_ratio_end: TestTVLtoLPCoinRatio {
                tvl: 0,
                lp_coins: 0,
            },
        }
    }

    public fun base_registry_view(): TestRegistryView {
        TestRegistryView {
            registry_address: registry_address(),
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

    public fun base_market_registration(): TestMarketRegistration {
        TestMarketRegistration {
            market_metadata: base_market_metadata(),
            time: 0,
            registrant: USER,
            integrator: INTEGRATOR,
            integrator_fee: 0,
        }
    }

    public fun fdv_for_newly_registered_market(): u128 {
        (
            (
                (get_QUOTE_VIRTUAL_FLOOR() as u256) * (get_EMOJICOIN_SUPPLY() as u256) /
                (get_BASE_VIRTUAL_CEILING() as u256)
            ) as u128
        )
    }

    public fun init_package() {
        timestamp::set_time_has_started_for_testing(&get_signer(@aptos_framework));
        init_module(&get_signer(@emojicoin_dot_fun));
    }

    public fun init_market(
        emoji_bytes: vector<vector<u8>>,
    ) {
        mint_aptos_coin_to(USER, get_MARKET_REGISTRATION_FEE());
        register_market_without_publish(&get_signer(USER), emoji_bytes, INTEGRATOR);
    }

    public fun init_market_and_coins_via_swap<Emojicoin, EmojicoinLP>(
        emoji_bytes: vector<vector<u8>>,
    ) {
        init_market(emoji_bytes);
        let input_amount = 100;
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

    public fun vectorize_periodic_state_tracker_base(
        base: TestPeriodicStateTracker
    ): vector<TestPeriodicStateTracker> {
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
        let market_metadata = TestMarketMetadata {
            market_id: 1,
            market_address: @black_cat_market,
            emoji_bytes: BLACK_CAT,
        };
        assert_chat(
            TestChat {
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
            TestChat {
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
        let registry_address =
            object::create_object_address(&@emojicoin_dot_fun, get_REGISTRY_NAME());
        assert!(registry_address == registry_address(), 0);

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
        time = time + get_MICROSECONDS_PER_SECOND();
        timestamp::update_global_time_for_test(time);
        register_market(&get_signer(USER), vector[BLACK_CAT], INTEGRATOR);
        let market_view = base_market_view();
        let market_metadata_1 = TestMarketMetadata {
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
        time = get_PERIOD_1D() + get_PERIOD_4H() + get_PERIOD_1H() + get_PERIOD_30M() +
            get_PERIOD_15M() + get_PERIOD_5M() + get_PERIOD_1M() + 1;
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
        let market_metadata_2 = TestMarketMetadata {
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
            let periodic_state_tracker_ref_mut: &mut TestPeriodicStateTracker = e;
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
        market_registration_1.time = one_day_and_one_hour + get_MICROSECONDS_PER_SECOND();
        let market_registration_2 = base_market_registration();
        market_registration_2.market_metadata = market_metadata_2;
        market_registration_2.time = time;
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
