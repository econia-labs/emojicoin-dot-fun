// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "period_type"))]
    pub struct PeriodType;

    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "trigger_type"))]
    pub struct TriggerType;
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::PeriodType;

    arena_candlesticks (melee_id, period, start_time) {
        melee_id -> Numeric,
        last_transaction_version -> Int8,
        period -> PeriodType,
        start_time -> Timestamp,
        open_price -> Numeric,
        high_price -> Numeric,
        low_price -> Numeric,
        close_price -> Numeric,
        volume -> Numeric,
        n_swaps -> Numeric,
    }
}

diesel::table! {
    arena_enter_events (transaction_version, event_index) {
        transaction_version -> Int8,
        event_index -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        user -> Text,
        melee_id -> Numeric,
        input_amount -> Numeric,
        quote_volume -> Numeric,
        integrator_fee -> Numeric,
        match_amount -> Numeric,
        emojicoin_0_proceeds -> Numeric,
        emojicoin_1_proceeds -> Numeric,
        emojicoin_0_exchange_rate_base -> Numeric,
        emojicoin_0_exchange_rate_quote -> Numeric,
        emojicoin_1_exchange_rate_base -> Numeric,
        emojicoin_1_exchange_rate_quote -> Numeric,
    }
}

diesel::table! {
    arena_exit_events (transaction_version, event_index) {
        transaction_version -> Int8,
        event_index -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        user -> Text,
        melee_id -> Numeric,
        tap_out_fee -> Numeric,
        emojicoin_0_proceeds -> Numeric,
        emojicoin_1_proceeds -> Numeric,
        apt_proceeds -> Numeric,
        emojicoin_0_exchange_rate_base -> Numeric,
        emojicoin_0_exchange_rate_quote -> Numeric,
        emojicoin_1_exchange_rate_base -> Numeric,
        emojicoin_1_exchange_rate_quote -> Numeric,
        during_melee -> Bool,
    }
}

diesel::table! {
    arena_info (melee_id) {
        melee_id -> Numeric,
        last_transaction_version -> Int8,
        volume -> Numeric,
        rewards_remaining -> Numeric,
        emojicoin_0_locked -> Numeric,
        emojicoin_1_locked -> Numeric,
        emojicoin_0_market_address -> Nullable<Text>,
        emojicoin_1_market_address -> Nullable<Text>,
        emojicoin_0_symbols -> Nullable<Array<Nullable<Text>>>,
        emojicoin_1_symbols -> Nullable<Array<Nullable<Text>>>,
        emojicoin_0_market_id -> Nullable<Numeric>,
        emojicoin_1_market_id -> Nullable<Numeric>,
        start_time -> Nullable<Timestamp>,
        duration -> Nullable<Numeric>,
        max_match_percentage -> Nullable<Numeric>,
        max_match_amount -> Nullable<Numeric>,
    }
}

diesel::table! {
    arena_leaderboard_history (user, melee_id) {
        user -> Text,
        last_transaction_version -> Int8,
        melee_id -> Numeric,
        profits -> Numeric,
        losses -> Numeric,
        emojicoin_0_balance -> Numeric,
        emojicoin_1_balance -> Numeric,
        exited -> Bool,
        last_exit_0 -> Nullable<Bool>,
        withdrawals -> Numeric,
    }
}

diesel::table! {
    arena_melee_events (melee_id) {
        transaction_version -> Int8,
        event_index -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        melee_id -> Numeric,
        emojicoin_0_market_address -> Text,
        emojicoin_1_market_address -> Text,
        start_time -> Timestamp,
        duration -> Numeric,
        max_match_percentage -> Numeric,
        max_match_amount -> Numeric,
        available_rewards -> Numeric,
    }
}

diesel::table! {
    arena_position (user, melee_id) {
        user -> Text,
        last_transaction_version -> Int8,
        melee_id -> Numeric,
        open -> Bool,
        emojicoin_0_balance -> Numeric,
        emojicoin_1_balance -> Numeric,
        withdrawals -> Numeric,
        deposits -> Numeric,
        match_amount -> Numeric,
        last_exit_0 -> Nullable<Bool>,
    }
}

diesel::table! {
    arena_swap_events (transaction_version, event_index) {
        transaction_version -> Int8,
        event_index -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        user -> Text,
        melee_id -> Numeric,
        quote_volume -> Numeric,
        integrator_fee -> Numeric,
        emojicoin_0_proceeds -> Numeric,
        emojicoin_1_proceeds -> Numeric,
        emojicoin_0_exchange_rate_base -> Numeric,
        emojicoin_0_exchange_rate_quote -> Numeric,
        emojicoin_1_exchange_rate_base -> Numeric,
        emojicoin_1_exchange_rate_quote -> Numeric,
        during_melee -> Bool,
    }
}

diesel::table! {
    arena_vault_balance_update_events (transaction_version, event_index) {
        transaction_version -> Int8,
        event_index -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        new_balance -> Numeric,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::PeriodType;

    candlesticks (market_id, period, start_time) {
        market_id -> Numeric,
        last_transaction_version -> Int8,
        period -> PeriodType,
        start_time -> Timestamp,
        open_price -> Numeric,
        high_price -> Numeric,
        low_price -> Numeric,
        close_price -> Numeric,
        volume -> Numeric,
        symbol_emojis -> Array<Nullable<Text>>,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;

    chat_events (market_id, market_nonce) {
        transaction_version -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        market_id -> Numeric,
        symbol_bytes -> Bytea,
        symbol_emojis -> Array<Nullable<Text>>,
        bump_time -> Timestamp,
        market_nonce -> Numeric,
        trigger -> TriggerType,
        #[max_length = 66]
        market_address -> Varchar,
        #[max_length = 66]
        user -> Varchar,
        message -> Text,
        user_emojicoin_balance -> Numeric,
        circulating_supply -> Numeric,
        balance_as_fraction_of_circulating_supply_q64 -> Numeric,
        clamm_virtual_reserves_base -> Numeric,
        clamm_virtual_reserves_quote -> Numeric,
        cpamm_real_reserves_base -> Numeric,
        cpamm_real_reserves_quote -> Numeric,
        lp_coin_supply -> Numeric,
        cumulative_stats_base_volume -> Numeric,
        cumulative_stats_quote_volume -> Numeric,
        cumulative_stats_integrator_fees -> Numeric,
        cumulative_stats_pool_fees_base -> Numeric,
        cumulative_stats_pool_fees_quote -> Numeric,
        cumulative_stats_n_swaps -> Numeric,
        cumulative_stats_n_chat_messages -> Numeric,
        instantaneous_stats_total_quote_locked -> Numeric,
        instantaneous_stats_total_value_locked -> Numeric,
        instantaneous_stats_market_cap -> Numeric,
        instantaneous_stats_fully_diluted_value -> Numeric,
        last_swap_is_sell -> Bool,
        last_swap_avg_execution_price_q64 -> Numeric,
        last_swap_base_volume -> Numeric,
        last_swap_quote_volume -> Numeric,
        last_swap_nonce -> Numeric,
        last_swap_time -> Timestamp,
        event_index -> Int8,
    }
}

diesel::table! {
    emojicoin_last_processed_transaction (id) {
        id -> Int8,
        version -> Int8,
    }
}

diesel::table! {
    emojis (emoji) {
        emoji -> Bytea,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;

    global_state_events (registry_nonce) {
        transaction_version -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        emit_time -> Timestamp,
        registry_nonce -> Numeric,
        trigger -> TriggerType,
        cumulative_quote_volume -> Numeric,
        total_quote_locked -> Numeric,
        total_value_locked -> Numeric,
        market_cap -> Numeric,
        fully_diluted_value -> Numeric,
        cumulative_integrator_fees -> Numeric,
        cumulative_swaps -> Numeric,
        cumulative_chat_messages -> Numeric,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;

    liquidity_events (market_id, market_nonce) {
        transaction_version -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        market_id -> Numeric,
        symbol_bytes -> Bytea,
        symbol_emojis -> Array<Nullable<Text>>,
        bump_time -> Timestamp,
        market_nonce -> Numeric,
        trigger -> TriggerType,
        #[max_length = 66]
        market_address -> Varchar,
        #[max_length = 66]
        provider -> Varchar,
        base_amount -> Numeric,
        quote_amount -> Numeric,
        lp_coin_amount -> Numeric,
        liquidity_provided -> Bool,
        base_donation_claim_amount -> Numeric,
        quote_donation_claim_amount -> Numeric,
        clamm_virtual_reserves_base -> Numeric,
        clamm_virtual_reserves_quote -> Numeric,
        cpamm_real_reserves_base -> Numeric,
        cpamm_real_reserves_quote -> Numeric,
        lp_coin_supply -> Numeric,
        cumulative_stats_base_volume -> Numeric,
        cumulative_stats_quote_volume -> Numeric,
        cumulative_stats_integrator_fees -> Numeric,
        cumulative_stats_pool_fees_base -> Numeric,
        cumulative_stats_pool_fees_quote -> Numeric,
        cumulative_stats_n_swaps -> Numeric,
        cumulative_stats_n_chat_messages -> Numeric,
        instantaneous_stats_total_quote_locked -> Numeric,
        instantaneous_stats_total_value_locked -> Numeric,
        instantaneous_stats_market_cap -> Numeric,
        instantaneous_stats_fully_diluted_value -> Numeric,
        last_swap_is_sell -> Bool,
        last_swap_avg_execution_price_q64 -> Numeric,
        last_swap_base_volume -> Numeric,
        last_swap_quote_volume -> Numeric,
        last_swap_nonce -> Numeric,
        last_swap_time -> Timestamp,
        block_number -> Int8,
        event_index -> Int8,
    }
}

diesel::table! {
    market_1m_periods_in_last_day (market_id, nonce) {
        market_id -> Numeric,
        inserted_at -> Timestamp,
        transaction_version -> Int8,
        nonce -> Numeric,
        volume -> Numeric,
        start_time -> Timestamp,
        base_volume -> Numeric,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;

    market_latest_state_event (market_id) {
        transaction_version -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        market_id -> Numeric,
        symbol_bytes -> Bytea,
        symbol_emojis -> Array<Nullable<Text>>,
        bump_time -> Timestamp,
        market_nonce -> Numeric,
        trigger -> TriggerType,
        #[max_length = 66]
        market_address -> Varchar,
        clamm_virtual_reserves_base -> Numeric,
        clamm_virtual_reserves_quote -> Numeric,
        cpamm_real_reserves_base -> Numeric,
        cpamm_real_reserves_quote -> Numeric,
        lp_coin_supply -> Numeric,
        cumulative_stats_base_volume -> Numeric,
        cumulative_stats_quote_volume -> Numeric,
        cumulative_stats_integrator_fees -> Numeric,
        cumulative_stats_pool_fees_base -> Numeric,
        cumulative_stats_pool_fees_quote -> Numeric,
        cumulative_stats_n_swaps -> Numeric,
        cumulative_stats_n_chat_messages -> Numeric,
        instantaneous_stats_total_quote_locked -> Numeric,
        instantaneous_stats_total_value_locked -> Numeric,
        instantaneous_stats_market_cap -> Numeric,
        instantaneous_stats_fully_diluted_value -> Numeric,
        last_swap_is_sell -> Bool,
        last_swap_avg_execution_price_q64 -> Numeric,
        last_swap_base_volume -> Numeric,
        last_swap_quote_volume -> Numeric,
        last_swap_nonce -> Numeric,
        last_swap_time -> Timestamp,
        daily_tvl_per_lp_coin_growth -> Numeric,
        in_bonding_curve -> Bool,
        volume_in_1m_state_tracker -> Numeric,
        base_volume_in_1m_state_tracker -> Numeric,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;

    market_registration_events (market_id) {
        transaction_version -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        market_id -> Numeric,
        symbol_bytes -> Bytea,
        symbol_emojis -> Array<Nullable<Text>>,
        bump_time -> Timestamp,
        market_nonce -> Numeric,
        trigger -> TriggerType,
        #[max_length = 66]
        market_address -> Varchar,
        #[max_length = 66]
        registrant -> Varchar,
        #[max_length = 66]
        integrator -> Varchar,
        integrator_fee -> Numeric,
        event_index -> Int8,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;
    use super::sql_types::PeriodType;

    periodic_state_events (market_id, period, market_nonce) {
        transaction_version -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        market_id -> Numeric,
        symbol_bytes -> Bytea,
        symbol_emojis -> Array<Nullable<Text>>,
        emit_time -> Timestamp,
        market_nonce -> Numeric,
        trigger -> TriggerType,
        #[max_length = 66]
        market_address -> Varchar,
        last_swap_is_sell -> Bool,
        last_swap_avg_execution_price_q64 -> Numeric,
        last_swap_base_volume -> Numeric,
        last_swap_quote_volume -> Numeric,
        last_swap_nonce -> Numeric,
        last_swap_time -> Timestamp,
        period -> PeriodType,
        start_time -> Timestamp,
        open_price_q64 -> Numeric,
        high_price_q64 -> Numeric,
        low_price_q64 -> Numeric,
        close_price_q64 -> Numeric,
        volume_base -> Numeric,
        volume_quote -> Numeric,
        integrator_fees -> Numeric,
        pool_fees_base -> Numeric,
        pool_fees_quote -> Numeric,
        n_swaps -> Numeric,
        n_chat_messages -> Numeric,
        starts_in_bonding_curve -> Bool,
        ends_in_bonding_curve -> Bool,
        tvl_per_lp_coin_growth_q64 -> Numeric,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;

    swap_events (market_id, market_nonce) {
        transaction_version -> Int8,
        #[max_length = 66]
        sender -> Varchar,
        #[max_length = 200]
        entry_function -> Nullable<Varchar>,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        market_id -> Numeric,
        symbol_bytes -> Bytea,
        symbol_emojis -> Array<Nullable<Text>>,
        bump_time -> Timestamp,
        market_nonce -> Numeric,
        trigger -> TriggerType,
        #[max_length = 66]
        market_address -> Varchar,
        #[max_length = 66]
        swapper -> Varchar,
        #[max_length = 66]
        integrator -> Varchar,
        integrator_fee -> Numeric,
        input_amount -> Numeric,
        is_sell -> Bool,
        integrator_fee_rate_bps -> Int2,
        net_proceeds -> Numeric,
        base_volume -> Numeric,
        quote_volume -> Numeric,
        avg_execution_price_q64 -> Numeric,
        pool_fee -> Numeric,
        starts_in_bonding_curve -> Bool,
        results_in_state_transition -> Bool,
        clamm_virtual_reserves_base -> Numeric,
        clamm_virtual_reserves_quote -> Numeric,
        cpamm_real_reserves_base -> Numeric,
        cpamm_real_reserves_quote -> Numeric,
        lp_coin_supply -> Numeric,
        cumulative_stats_base_volume -> Numeric,
        cumulative_stats_quote_volume -> Numeric,
        cumulative_stats_integrator_fees -> Numeric,
        cumulative_stats_pool_fees_base -> Numeric,
        cumulative_stats_pool_fees_quote -> Numeric,
        cumulative_stats_n_swaps -> Numeric,
        cumulative_stats_n_chat_messages -> Numeric,
        instantaneous_stats_total_quote_locked -> Numeric,
        instantaneous_stats_total_value_locked -> Numeric,
        instantaneous_stats_market_cap -> Numeric,
        instantaneous_stats_fully_diluted_value -> Numeric,
        balance_as_fraction_of_circulating_supply_before_q64 -> Numeric,
        balance_as_fraction_of_circulating_supply_after_q64 -> Numeric,
        block_number -> Int8,
        event_index -> Int8,
    }
}

diesel::table! {
    unregistered_markets (emojis) {
        emojis -> Bytea,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::TriggerType;

    user_liquidity_pools (provider, market_id) {
        #[max_length = 66]
        provider -> Varchar,
        transaction_version -> Int8,
        transaction_timestamp -> Timestamp,
        inserted_at -> Timestamp,
        market_id -> Numeric,
        symbol_bytes -> Bytea,
        symbol_emojis -> Array<Nullable<Text>>,
        bump_time -> Timestamp,
        market_nonce -> Numeric,
        trigger -> TriggerType,
        #[max_length = 66]
        market_address -> Varchar,
        base_amount -> Numeric,
        quote_amount -> Numeric,
        lp_coin_amount -> Numeric,
        liquidity_provided -> Bool,
        base_donation_claim_amount -> Numeric,
        quote_donation_claim_amount -> Numeric,
        lp_coin_balance -> Numeric,
    }
}

diesel::allow_tables_to_appear_in_same_query!(
    arena_candlesticks,
    arena_enter_events,
    arena_exit_events,
    arena_info,
    arena_leaderboard_history,
    arena_melee_events,
    arena_position,
    arena_swap_events,
    arena_vault_balance_update_events,
    candlesticks,
    chat_events,
    emojicoin_last_processed_transaction,
    emojis,
    global_state_events,
    liquidity_events,
    market_1m_periods_in_last_day,
    market_latest_state_event,
    market_registration_events,
    periodic_state_events,
    swap_events,
    unregistered_markets,
    user_liquidity_pools,
);
