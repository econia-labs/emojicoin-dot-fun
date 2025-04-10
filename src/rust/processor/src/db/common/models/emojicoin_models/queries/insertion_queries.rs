use crate::{db::common::models::emojicoin_models::models::prelude::*, schema};
use bigdecimal::Zero;
use diesel::{
    dsl::sql,
    pg::Pg,
    query_builder::QueryFragment,
    query_dsl::methods::FilterDsl,
    sql_query,
    sql_types::{Bool, Nullable},
    upsert::excluded,
    ExpressionMethods,
};

pub fn insert_chat_events_query(
    items_to_insert: Vec<ChatEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::chat_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_liquidity_events_query(
    items_to_insert: Vec<LiquidityEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::liquidity_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_swap_events_query(
    items_to_insert: Vec<SwapEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::swap_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_market_registration_events_query(
    items_to_insert: Vec<MarketRegistrationEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::market_registration_events::table).values(items_to_insert),
        None,
    )
}

pub fn delete_unregistered_markets_query(
    items_to_remove: Vec<MarketRegistrationEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    use schema::unregistered_markets::dsl::*;
    let data = items_to_remove
        .iter()
        .map(|e| e.symbol_bytes.clone())
        .collect::<Vec<_>>();
    (
        diesel::delete(unregistered_markets.filter(emojis.eq_any(data))),
        None,
    )
}

pub fn insert_periodic_state_events_query(
    items_to_insert: Vec<PeriodicStateEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::periodic_state_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_global_events(
    items_to_insert: Vec<GlobalStateEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::global_state_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_user_liquidity_pools_query(
    items_to_insert: Vec<UserLiquidityPoolsModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    use schema::user_liquidity_pools::dsl::*;
    (
        diesel::insert_into(schema::user_liquidity_pools::table)
            .values(items_to_insert)
            .on_conflict((provider, market_id))
            .do_update()
            .set((
                transaction_version.eq(excluded(transaction_version)),
                transaction_timestamp.eq(excluded(transaction_timestamp)),
                inserted_at.eq(excluded(inserted_at)),
                bump_time.eq(excluded(bump_time)),
                market_nonce.eq(excluded(market_nonce)),
                trigger.eq(excluded(trigger)),
                base_amount.eq(excluded(base_amount)),
                quote_amount.eq(excluded(quote_amount)),
                lp_coin_amount.eq(excluded(lp_coin_amount)),
                liquidity_provided.eq(excluded(liquidity_provided)),
                base_donation_claim_amount.eq(excluded(base_donation_claim_amount)),
                quote_donation_claim_amount.eq(excluded(quote_donation_claim_amount)),
                lp_coin_balance.eq(excluded(lp_coin_balance)),
            ))
            .filter(market_nonce.le(excluded(market_nonce))),
        None,
    )
}

pub fn insert_market_latest_state_event_query(
    items_to_insert: Vec<MarketLatestStateEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    use schema::market_latest_state_event::dsl::*;
    (
        diesel::insert_into(schema::market_latest_state_event::table)
            .values(items_to_insert)
            .on_conflict(market_id)
            .do_update()
            .set((
                transaction_version.eq(excluded(transaction_version)),
                sender.eq(excluded(sender)),
                entry_function.eq(excluded(entry_function)),
                transaction_timestamp.eq(excluded(transaction_timestamp)),
                bump_time.eq(excluded(bump_time)),
                market_nonce.eq(excluded(market_nonce)),
                trigger.eq(excluded(trigger)),
                clamm_virtual_reserves_base.eq(excluded(clamm_virtual_reserves_base)),
                clamm_virtual_reserves_quote.eq(excluded(clamm_virtual_reserves_quote)),
                cpamm_real_reserves_base.eq(excluded(cpamm_real_reserves_base)),
                cpamm_real_reserves_quote.eq(excluded(cpamm_real_reserves_quote)),
                lp_coin_supply.eq(excluded(lp_coin_supply)),
                cumulative_stats_base_volume.eq(excluded(cumulative_stats_base_volume)),
                cumulative_stats_quote_volume.eq(excluded(cumulative_stats_quote_volume)),
                cumulative_stats_integrator_fees.eq(excluded(cumulative_stats_integrator_fees)),
                cumulative_stats_pool_fees_base.eq(excluded(cumulative_stats_pool_fees_base)),
                cumulative_stats_pool_fees_quote.eq(excluded(cumulative_stats_pool_fees_quote)),
                cumulative_stats_n_swaps.eq(excluded(cumulative_stats_n_swaps)),
                cumulative_stats_n_chat_messages.eq(excluded(cumulative_stats_n_chat_messages)),
                instantaneous_stats_total_quote_locked
                    .eq(excluded(instantaneous_stats_total_quote_locked)),
                instantaneous_stats_total_value_locked
                    .eq(excluded(instantaneous_stats_total_value_locked)),
                instantaneous_stats_market_cap.eq(excluded(instantaneous_stats_market_cap)),
                instantaneous_stats_fully_diluted_value
                    .eq(excluded(instantaneous_stats_fully_diluted_value)),
                last_swap_is_sell.eq(excluded(last_swap_is_sell)),
                last_swap_avg_execution_price_q64.eq(excluded(last_swap_avg_execution_price_q64)),
                last_swap_base_volume.eq(excluded(last_swap_base_volume)),
                last_swap_quote_volume.eq(excluded(last_swap_quote_volume)),
                last_swap_nonce.eq(excluded(last_swap_nonce)),
                last_swap_time.eq(excluded(last_swap_time)),
                daily_tvl_per_lp_coin_growth.eq(excluded(daily_tvl_per_lp_coin_growth)),
                in_bonding_curve.eq(excluded(in_bonding_curve)),
                volume_in_1m_state_tracker.eq(excluded(volume_in_1m_state_tracker)),
                base_volume_in_1m_state_tracker.eq(excluded(base_volume_in_1m_state_tracker)),
            ))
            .filter(market_nonce.le(excluded(market_nonce))),
        None,
    )
}

pub fn insert_arena_melee_events_query(
    items_to_insert: Vec<ArenaMeleeEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::arena_melee_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_arena_position_query(
    items_to_insert: Vec<ArenaPositionDiffModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    use schema::arena_position::dsl::*;
    (
        diesel::insert_into(schema::arena_position::table)
            .values(items_to_insert)
            .on_conflict((user, melee_id))
            .do_update()
            .set((
                open.eq(excluded(open)),
                last_transaction_version.eq(excluded(last_transaction_version)),
                emojicoin_0_balance.eq(emojicoin_0_balance + excluded(emojicoin_0_balance)),
                emojicoin_1_balance.eq(emojicoin_1_balance + excluded(emojicoin_1_balance)),
                deposits.eq(deposits + excluded(deposits)),
                match_amount.eq(match_amount + excluded(match_amount)),
                withdrawals.eq(withdrawals + excluded(withdrawals)),
                last_exit_0.eq(sql::<Nullable<Bool>>(
                    "COALESCE(EXCLUDED.last_exit_0, arena_position.last_exit_0)",
                )),
            )),
        None,
    )
}

pub fn insert_arena_info_query(
    info: Vec<ArenaInfoModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    use schema::arena_info::dsl::*;
    (
        diesel::insert_into(schema::arena_info::table)
            .values(info)
            .on_conflict(melee_id)
            .do_update()
            .set((
                last_transaction_version.eq(excluded(last_transaction_version)),
                rewards_remaining.eq(rewards_remaining + excluded(rewards_remaining)),
                emojicoin_0_market_address.eq(excluded(emojicoin_0_market_address)),
                emojicoin_1_market_address.eq(excluded(emojicoin_1_market_address)),
                emojicoin_0_symbols.eq(excluded(emojicoin_0_symbols)),
                emojicoin_1_symbols.eq(excluded(emojicoin_1_symbols)),
                emojicoin_0_market_id.eq(excluded(emojicoin_0_market_id)),
                emojicoin_1_market_id.eq(excluded(emojicoin_1_market_id)),
                start_time.eq(excluded(start_time)),
                duration.eq(excluded(duration)),
                max_match_percentage.eq(excluded(max_match_percentage)),
                max_match_amount.eq(excluded(max_match_amount)),
            )),
        None,
    )
}

pub fn update_arena_info_query(
    items_to_update: Vec<ArenaInfoDiffUpdate>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    use schema::arena_info::dsl::*;
    let i: Vec<_> = items_to_update
        .into_iter()
        .map(|i| {
            (
                melee_id.eq(i.melee_id),
                last_transaction_version.eq(i.last_transaction_version),
                volume.eq(i.volume.clone()),
                rewards_remaining.eq(i.rewards_remaining),
                emojicoin_0_locked.eq(i.emojicoin_0_locked),
                emojicoin_1_locked.eq(i.emojicoin_1_locked),
            )
        })
        .collect();
    (
        diesel::insert_into(schema::arena_info::table)
            .values(i)
            .on_conflict(melee_id)
            .do_update()
            .set((
                volume.eq(volume + excluded(volume)),
                last_transaction_version.eq(excluded(last_transaction_version)),
                rewards_remaining.eq(rewards_remaining + excluded(rewards_remaining)),
                emojicoin_0_locked.eq(emojicoin_0_locked + excluded(emojicoin_0_locked)),
                emojicoin_1_locked.eq(emojicoin_1_locked + excluded(emojicoin_1_locked)),
            )),
        None,
    )
}

pub fn insert_arena_leaderboard_history_query(
    arena_leaderboard_history_model: ArenaLeaderboardHistoryPartialModel,
) -> impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send {
    let mut query = include_str!("./leaderboard.sql").to_string();

    // See header comment of leaderboard.sql for more information on query parameters.

    // $1 is the melee_id.
    query = query.replace("$1", &arena_leaderboard_history_model.melee_id.to_string());

    // $2 is the curve price of emojicoin_0.
    query = query.replace(
        "$2",
        &arena_leaderboard_history_model
            .emojicoin_0_price
            .to_string(),
    );

    // $3 is the curve price of emojicoin_1.
    query = query.replace(
        "$3",
        &arena_leaderboard_history_model
            .emojicoin_1_price
            .to_string(),
    );

    // $4 is the transaction version of this snapshot; i.e., when this melee ended.
    query = query.replace(
        "$4",
        &arena_leaderboard_history_model
            .last_transaction_version
            .to_string(),
    );

    sql_query(query)
}

pub fn update_arena_leaderboard_history_query(
    exit: ArenaExitEventModel,
) -> impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send {
    use schema::arena_leaderboard_history::dsl::*;
    diesel::update(arena_leaderboard_history)
        .filter(melee_id.eq(exit.melee_id))
        .filter(user.eq(exit.user))
        .set((
            exited.eq(true),
            last_transaction_version.eq(exit.transaction_version),
            last_exit_0.eq(exit.emojicoin_1_proceeds.is_zero()),
        ))
}

pub fn insert_arena_enter_events_query(
    items_to_insert: Vec<ArenaEnterEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::arena_enter_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_arena_exit_events_query(
    items_to_insert: Vec<ArenaExitEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::arena_exit_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_arena_swap_events_query(
    items_to_insert: Vec<ArenaSwapEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::arena_swap_events::table).values(items_to_insert),
        None,
    )
}

pub fn insert_arena_vault_balance_update_events_query(
    items_to_insert: Vec<ArenaVaultBalanceUpdateEventModel>,
) -> (
    impl QueryFragment<Pg> + diesel::query_builder::QueryId + Send,
    Option<&'static str>,
) {
    (
        diesel::insert_into(schema::arena_vault_balance_update_events::table)
            .values(items_to_insert),
        None,
    )
}

pub mod run_queries {
    //! Due to the way diesel types queries, it's not possible to use an insert query that has a
    //! [`diesel::query_builder::InsertStatement::returning`] clause with the helper functions
    //! declared in the [`crate::utils::database`] module. For that reason, those queries are
    //! isolated in this [`run_queries`] module.

    macro_rules! coalesce {
        // coalesce!(open) -> COALESCE(open, excluded(open))
        ($column:expr) => {
            sql("COALESCE(")
                .bind($column)
                .sql(",")
                .bind(excluded($column))
                .sql(")")
        };

        // coalesce!("GREATEST", high) -> GREATEST(COALESCE(high, excluded(high)))
        // coalesce!("LEAST", low)     -> LEAST(COALESCE(low, excluded(low)))
        ($operation:expr, $column:expr) => {
            sql(concat!($operation, "(COALESCE("))
                .bind($column)
                .sql(",")
                .bind(excluded($column))
                .sql("),")
                .bind(excluded($column))
                .sql(")")
        };
    }

    use crate::{db::common::models::emojicoin_models::models::prelude::*, schema};
    use diesel::{dsl::sql, upsert::excluded, ExpressionMethods};
    use diesel_async::{pooled_connection::bb8::PooledConnection, AsyncPgConnection, RunQueryDsl};

    pub async fn insert_arena_candlesticks_query(
        conn: &mut PooledConnection<'_, AsyncPgConnection>,
        items_to_insert: Vec<ArenaCandlestickModel>,
        chunk_size: usize,
    ) -> Result<Vec<ArenaCandlestickModel>, diesel::result::Error> {
        use schema::arena_candlesticks::dsl::*;
        let mut res = vec![];
        for chunk in items_to_insert.chunks(chunk_size) {
            let r = diesel::insert_into(schema::arena_candlesticks::table)
                .values(chunk)
                .on_conflict((melee_id, period, start_time))
                .do_update()
                .set((
                    last_transaction_version.eq(excluded(last_transaction_version)),
                    open_price.eq(coalesce!(open_price)),
                    high_price.eq(coalesce!("GREATEST", high_price)),
                    low_price.eq(coalesce!("LEAST", low_price)),
                    close_price.eq(excluded(close_price)),
                    volume.eq(volume + excluded(volume)),
                    n_swaps.eq(n_swaps + excluded(n_swaps)),
                ))
                .returning(schema::arena_candlesticks::all_columns)
                .get_results::<AllArenaCandlestickColumns>(conn)
                .await?;
            res.extend(r);
        }
        Ok(res.into_iter().map(|e| e.into()).collect())
    }

    pub async fn insert_candlesticks_query(
        conn: &mut PooledConnection<'_, AsyncPgConnection>,
        items_to_insert: Vec<CandlestickModel>,
        chunk_size: usize,
    ) -> Result<Vec<CandlestickModel>, diesel::result::Error> {
        use schema::candlesticks::dsl::*;
        let mut res = vec![];
        for chunk in items_to_insert.chunks(chunk_size) {
            let r = diesel::insert_into(schema::candlesticks::table)
                .values(chunk)
                .on_conflict((market_id, period, start_time))
                .do_update()
                .set((
                    last_transaction_version.eq(excluded(last_transaction_version)),
                    open_price.eq(coalesce!(open_price)),
                    high_price.eq(coalesce!("GREATEST", high_price)),
                    low_price.eq(coalesce!("LEAST", low_price)),
                    close_price.eq(excluded(close_price)),
                    volume.eq(volume + excluded(volume)),
                ))
                .returning(schema::candlesticks::all_columns)
                .get_results::<AllCandlestickColumns>(conn)
                .await?;
            res.extend(r);
        }
        Ok(res.into_iter().map(|e| e.into()).collect())
    }
}
