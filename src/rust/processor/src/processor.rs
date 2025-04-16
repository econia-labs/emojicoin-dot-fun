use crate::{
    db::{
        common::models::emojicoin_models::{
            constants::ARENA_MODULE_ADDRESS,
            enums::{EmojicoinTypeTag, Trigger},
            event_utils::EventGroupBuilder,
            json_types::{
                ArenaEvent, BumpEvent, EventGroup, EventWithMarket, GlobalStateEvent,
                InstantaneousStats, MarketRegistrationEvent, MarketResource, StateEvent, TxnInfo,
            },
            models::prelude::*,
            parsers::emojis::parser::symbol_bytes_to_emojis,
            queries::insertion_queries::*,
        },
        utils::{execute_in_transaction, execute_single_transaction},
    },
    emojicoin_dot_fun::EmojicoinDbEvent,
    schema,
};
use ahash::AHashMap;
use anyhow::{anyhow, Context};
use aptos_indexer_processor_sdk::{
    aptos_indexer_transaction_stream::utils::time::parse_timestamp,
    aptos_protos::transaction::v1::{transaction::TxnData, Transaction},
    postgres::utils::database::{get_config_table_chunk_size, ArcDbPool},
    utils::{
        convert::{bigdecimal_to_u64, standardize_address},
        extract::get_entry_function_from_user_request,
    },
};
use bigdecimal::BigDecimal;
use diesel::{upsert::excluded, ExpressionMethods as _, QueryDsl as _};
use diesel_async::{scoped_futures::ScopedFutureExt, AsyncConnection, RunQueryDsl};
use itertools::Itertools;
use num::Zero;
use std::{fmt::Debug, sync::Arc};
use tokio::sync::{mpsc::UnboundedSender, RwLock};
use tracing::info;

pub struct MeleeData {
    pub price_0: BigDecimal,
    pub price_1: BigDecimal,
    pub market_id_0: BigDecimal,
    pub market_id_1: BigDecimal,
    pub melee_id: BigDecimal,
}

pub struct EmojicoinProcessor {
    connection_pool: ArcDbPool,
    per_table_chunk_sizes: AHashMap<String, usize>,
    notif_sender: UnboundedSender<EmojicoinDbEvent>,
    melee_data: Arc<RwLock<Option<MeleeData>>>,
    version: Arc<RwLock<u64>>,
}

async fn get_market_price_from_db(
    connection_pool: ArcDbPool,
    m_id: BigDecimal,
) -> anyhow::Result<BigDecimal> {
    use schema::market_latest_state_event::dsl::*;
    let (lp_supply, clamm_base, clamm_quote, cpamm_base, cpamm_quote) = market_latest_state_event
        .filter(market_id.eq(m_id))
        .select((
            lp_coin_supply,
            clamm_virtual_reserves_base,
            clamm_virtual_reserves_quote,
            cpamm_real_reserves_base,
            cpamm_real_reserves_quote,
        ))
        .first::<(BigDecimal, BigDecimal, BigDecimal, BigDecimal, BigDecimal)>(
            &mut connection_pool.get().await?,
        )
        .await?;
    let price = if lp_supply.is_zero() {
        clamm_quote / clamm_base
    } else {
        cpamm_quote / cpamm_base
    };
    Ok(price)
}

/// Gets MeleeData from the database.
async fn get_melee_data_from_db(connection_pool: ArcDbPool) -> anyhow::Result<Option<MeleeData>> {
    if ARENA_MODULE_ADDRESS.is_none() {
        return Ok::<Option<MeleeData>, anyhow::Error>(None);
    }
    let conn = &mut connection_pool.get().await?;
    let melee = {
        use schema::arena_info::dsl::*;
        let melee = arena_info
            .select((melee_id, emojicoin_0_market_id, emojicoin_1_market_id))
            .order(melee_id.desc())
            .limit(1)
            .get_results::<(BigDecimal, Option<BigDecimal>, Option<BigDecimal>)>(conn)
            .await?;
        melee.as_slice().first().cloned()
    };
    if melee.is_none() {
        return Ok::<Option<MeleeData>, anyhow::Error>(None);
    }
    let (melee_id, market_id_0, market_id_1) = melee.unwrap();
    let (market_id_0, market_id_1) = (market_id_0.unwrap(), market_id_1.unwrap());
    let (price_0, price_1) = {
        let price_0 =
            get_market_price_from_db(connection_pool.clone(), market_id_0.clone()).await?;
        let price_1 =
            get_market_price_from_db(connection_pool.clone(), market_id_1.clone()).await?;
        (price_0, price_1)
    };
    Ok(Some(MeleeData {
        melee_id,
        market_id_0,
        market_id_1,
        price_0,
        price_1,
    }))
}

/// Gets the latest processed version from the database.
async fn get_version_from_db(connection_pool: ArcDbPool) -> anyhow::Result<u64> {
    let conn = &mut connection_pool.get().await?;
    let version = {
        use schema::emojicoin_last_processed_transaction::dsl::*;
        let v = emojicoin_last_processed_transaction
            .select(version)
            .get_results::<i64>(conn)
            .await?;
        v.as_slice().first().cloned()
    };
    if let Some(version) = version {
        Ok(version.try_into().expect("Last version is negative"))
    } else {
        Ok::<u64, anyhow::Error>(0)
    }
}

impl EmojicoinProcessor {
    pub async fn new(
        connection_pool: ArcDbPool,
        per_table_chunk_sizes: AHashMap<String, usize>,
        notif_sender: UnboundedSender<EmojicoinDbEvent>,
    ) -> anyhow::Result<Self> {
        let melee_data = get_melee_data_from_db(connection_pool.clone()).await?;
        let version = get_version_from_db(connection_pool.clone()).await?;

        Ok(Self {
            connection_pool,
            per_table_chunk_sizes,
            notif_sender,
            melee_data: Arc::new(RwLock::new(melee_data)),
            version: Arc::new(RwLock::new(version)),
        })
    }

    pub fn publish_events(&self, events: Vec<EmojicoinDbEvent>) {
        for event in events {
            if let Err(e) = self.notif_sender.send(event) {
                tracing::error!("Could not send events to websocket server: {e}")
            }
        }
    }
}

impl Debug for EmojicoinProcessor {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let state = &self.connection_pool.state();
        write!(
            f,
            "EmojicoinProcessor {{ connections: {:?}  idle_connections: {:?} }}",
            state.connections, state.idle_connections
        )
    }
}

struct InsertEvents {
    candlesticks: Vec<CandlestickModel>,
    market_registration_events: Vec<MarketRegistrationEventModel>,
    swap_events: Vec<SwapEventModel>,
    chat_events: Vec<ChatEventModel>,
    liquidity_events: Vec<LiquidityEventModel>,
    periodic_state_events: Vec<PeriodicStateEventModel>,
    global_state_events: Vec<GlobalStateEventModel>,
    market_latest_state_events: Vec<MarketLatestStateEventModel>,
    market_1m_periods: Vec<MarketOneMinutePeriodsInLastDayModel>,
    user_pools: Vec<UserLiquidityPoolsModel>,
    arena_melee_events: Vec<ArenaMeleeEventModel>,
    arena_enter_events: Vec<ArenaEnterEventModel>,
    arena_exit_events: Vec<ArenaExitEventModel>,
    arena_swap_events: Vec<ArenaSwapEventModel>,
    arena_vault_balance_update_events: Vec<ArenaVaultBalanceUpdateEventModel>,
    arena_position: Vec<ArenaPositionDiffModel>,
    arena_info: Vec<ArenaInfoModel>,
    arena_leaderboard_history: Vec<ArenaLeaderboardHistoryPartialModel>,
    arena_info_update: Vec<ArenaInfoDiffUpdate>,
    arena_candlesticks: Vec<ArenaCandlestickModel>,
}

async fn insert_to_db(
    pool: ArcDbPool,
    name: &'static str,
    insert_events: InsertEvents,
    per_table_chunk_sizes: &AHashMap<String, usize>,
    max_transaction_version: u64,
    last_transaction: &Transaction,
) -> Result<(Vec<CandlestickModel>, Vec<ArenaCandlestickModel>), diesel::result::Error> {
    tracing::trace!(name = name, "Inserting to db",);
    let InsertEvents {
        market_registration_events,
        swap_events,
        chat_events,
        liquidity_events,
        periodic_state_events,
        global_state_events,
        market_latest_state_events,
        market_1m_periods,
        user_pools,
        arena_melee_events,
        arena_enter_events,
        arena_exit_events,
        arena_swap_events,
        arena_vault_balance_update_events,
        arena_position,
        arena_info,
        arena_leaderboard_history,
        arena_info_update,
        arena_candlesticks,
        candlesticks,
    } = insert_events;

    let mut conn = pool.get().await.unwrap();

    conn.transaction(|conn| {
        async move {
            execute_in_transaction(
                conn,
                insert_market_registration_events_query,
                &market_registration_events,
                get_config_table_chunk_size::<MarketRegistrationEventModel>(
                    "market_registration_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                delete_unregistered_markets_query,
                &market_registration_events,
                get_config_table_chunk_size::<MarketRegistrationEventModel>(
                    "unregistered_markets",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            MarketOneMinutePeriodsInLastDayModel::insert_and_delete_periods(
                market_1m_periods,
                conn,
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_swap_events_query,
                &swap_events,
                get_config_table_chunk_size::<SwapEventModel>("swap_events", per_table_chunk_sizes),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_chat_events_query,
                &chat_events,
                get_config_table_chunk_size::<ChatEventModel>("chat_events", per_table_chunk_sizes),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_liquidity_events_query,
                &liquidity_events,
                get_config_table_chunk_size::<LiquidityEventModel>(
                    "liquidity_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_periodic_state_events_query,
                &periodic_state_events,
                get_config_table_chunk_size::<PeriodicStateEventModel>(
                    "periodic_state_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_global_events,
                &global_state_events,
                get_config_table_chunk_size::<GlobalStateEventModel>(
                    "global_state_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_user_liquidity_pools_query,
                &user_pools,
                get_config_table_chunk_size::<UserLiquidityPoolsModel>(
                    "user_liquidity_pools",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_market_latest_state_event_query,
                &market_latest_state_events,
                get_config_table_chunk_size::<MarketLatestStateEventModel>(
                    "market_latest_state_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_arena_position_query,
                &arena_position,
                get_config_table_chunk_size::<ArenaPositionDiffModel>(
                    "arena_position",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_arena_info_query,
                &arena_info,
                get_config_table_chunk_size::<ArenaPositionDiffModel>(
                    "arena_info",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                update_arena_info_query,
                &arena_info_update,
                get_config_table_chunk_size::<ArenaPositionDiffModel>(
                    "arena_info",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_arena_enter_events_query,
                &arena_enter_events,
                get_config_table_chunk_size::<ArenaEnterEventModel>(
                    "arena_enter_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_arena_exit_events_query,
                &arena_exit_events,
                get_config_table_chunk_size::<ArenaExitEventModel>(
                    "arena_exit_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_arena_swap_events_query,
                &arena_swap_events,
                get_config_table_chunk_size::<ArenaSwapEventModel>(
                    "arena_swap_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_arena_vault_balance_update_events_query,
                &arena_vault_balance_update_events,
                get_config_table_chunk_size::<ArenaVaultBalanceUpdateEventModel>(
                    "arena_vault_balance_update_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_in_transaction(
                conn,
                insert_arena_melee_events_query,
                &arena_melee_events,
                get_config_table_chunk_size::<ArenaMeleeEventModel>(
                    "arena_melee_events",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            let arena_candlesticks = run_queries::insert_arena_candlesticks_query(
                conn,
                arena_candlesticks,
                get_config_table_chunk_size::<ArenaCandlestickModel>(
                    "arena_candlesticks",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            let candlesticks = run_queries::insert_candlesticks_query(
                conn,
                candlesticks,
                get_config_table_chunk_size::<CandlestickModel>(
                    "candlesticks",
                    per_table_chunk_sizes,
                ),
            )
            .await?;
            execute_single_transaction(
                conn,
                update_arena_leaderboard_history_query,
                &arena_exit_events,
            )
            .await?;

            if ARENA_MODULE_ADDRESS.is_some() {
                // Run this after everything else to make sure necessary events for the generation of the
                // leaderboard history are already inserted.
                execute_single_transaction(
                    conn,
                    insert_arena_leaderboard_history_query,
                    &arena_leaderboard_history,
                )
                .await?;
            }

            {
                use schema::emojicoin_last_processed_transaction::dsl::*;
                diesel::insert_into(emojicoin_last_processed_transaction)
                    .values((id.eq(1), version.eq(max_transaction_version as i64)))
                    .on_conflict(id)
                    .do_update()
                    .set(version.eq(excluded(version)))
                    .execute(conn)
                    .await?;
            }

            {
                use schema::processor_status::dsl::*;
                let timestamp =  parse_timestamp(last_transaction.timestamp.as_ref().unwrap(), last_transaction.version as i64)
                    .naive_utc();
                diesel::insert_into(processor_status)
                    .values((processor.eq("emojicoin"), last_success_version.eq(last_transaction.version as i64), last_transaction_timestamp.eq(timestamp)))
                    .on_conflict(processor)
                    .do_update()
                    .set((last_success_version.eq(last_transaction.version as i64), last_transaction_timestamp.eq(timestamp)))
                    .execute(conn)
                    .await?;
            }

            Ok::<(Vec<CandlestickModel>, Vec<ArenaCandlestickModel>), diesel::result::Error>((
                candlesticks,
                arena_candlesticks,
            ))
        }
        .scope_boxed()
    })
    .await
}

struct MarketData {
    market_id: BigDecimal,
    symbol_emojis: Vec<String>,
    price: BigDecimal,
}

/// Get id, price and symbol emojis for a market.
///
/// If possible, the data will be extracted from the current batch of events.
/// If not, the database will be queried for historical data.
async fn get_market_data(
    market_address_str: &str,
    registers: &[MarketRegistrationEvent],
    states: &AHashMap<BigDecimal, StateEvent>,
    pool: &ArcDbPool,
) -> anyhow::Result<MarketData> {
    // Get market registration event for the market.
    //
    // This will return Some if the market was registered in the current batch of transactions.
    //
    // Although this is highly unlikely, it is possible for a market to be registered then selected
    // for a melee in the same transaction (or in two very close ones). Because of this, the market
    // latest state event could not be yet in the DB, and thus we have to check that it is not in
    // memory.
    let registration = registers
        .iter()
        .find(|r| r.market_metadata.market_address == market_address_str);
    let data = if let Some(registration) = registration {
        let price = if let Some(state) = states.get(&registration.market_metadata.market_id) {
            state.curve_price()
        } else {
            BigDecimal::zero()
        };
        MarketData {
            market_id: registration.market_metadata.market_id.clone(),
            symbol_emojis: symbol_bytes_to_emojis(&registration.market_metadata.emoji_bytes),
            price,
        }
    } else {
        let conn = &mut pool.get().await?;

        // Since the market was NOT registered in this batch of events, then a mlse MUST be present
        // in the DB.
        let (
            market_id,
            symbol_emojis,
            lp_coin_supply,
            clamm_virtual_reserves_base,
            clamm_virtual_reserves_quote,
            cpamm_real_reserves_base,
            cpamm_real_reserves_quote,
        ) = {
            use schema::market_latest_state_event::dsl::*;
            market_latest_state_event
                .filter(market_address.eq(market_address_str))
                .select((
                    market_id,
                    symbol_emojis,
                    lp_coin_supply,
                    clamm_virtual_reserves_base,
                    clamm_virtual_reserves_quote,
                    cpamm_real_reserves_base,
                    cpamm_real_reserves_quote,
                ))
                .first::<(
                    BigDecimal,
                    Vec<Option<String>>,
                    BigDecimal,
                    BigDecimal,
                    BigDecimal,
                    BigDecimal,
                    BigDecimal,
                )>(conn)
                .await?
        };

        let price = if lp_coin_supply.is_zero() {
            clamm_virtual_reserves_quote / clamm_virtual_reserves_base
        } else {
            cpamm_real_reserves_quote / cpamm_real_reserves_base
        };

        MarketData {
            market_id,
            symbol_emojis: symbol_emojis
                .into_iter()
                .map(|s| s.unwrap())
                .collect::<Vec<_>>(),
            price,
        }
    };
    Ok(data)
}

impl EmojicoinProcessor {
    async fn process_transaction(
        &self,
        pool: &ArcDbPool,
        txn: &Transaction,
        user_pools_db: &mut AHashMap<(String, u64), UserLiquidityPoolsModel>,
        market_registrations: &mut Vec<MarketRegistrationEvent>,
        period_data: &mut Vec<RecentOneMinutePeriodicStateEvent>,
        latest_market_resources: &mut AHashMap<
            u64,
            (TxnInfo, MarketResource, Trigger, InstantaneousStats),
        >,
        arena_candlesticks_builders: &mut Vec<ArenaCandlestickDiffModelBuilder>,
        candlesticks_builders: &mut Vec<CandlestickDiffModelBuilder>,
        states: &mut AHashMap<BigDecimal, StateEvent>,
        insert_events: &mut InsertEvents,
    ) -> anyhow::Result<()> {
        let mut melee_data = self.melee_data.write().await;
        let txn_version = txn.version as i64;
        let block_number = txn.block_height as i64;
        let txn_data = match txn.txn_data.as_ref() {
            Some(data) => data,
            None => {
                tracing::warn!(
                    transaction_version = txn_version,
                    "Transaction data doesn't exist"
                );
                return Ok(());
            }
        };

        if let TxnData::User(user_txn) = txn_data {
            let user_request = user_txn
                .request
                .as_ref()
                .expect("User request info is not present in the user transaction.");
            let entry_function = get_entry_function_from_user_request(user_request);
            let txn_info = TxnInfo {
                block_number,
                version: txn_version,
                sender: standardize_address(user_request.sender.as_ref()),
                entry_function,
                timestamp: parse_timestamp(txn.timestamp.as_ref().unwrap(), txn_version)
                    .naive_utc(),
            };

            // Group the market events in this transaction.
            let mut market_events = vec![];

            // The two most recent state events as: (most_recent, 2nd_most_recent).
            let mut last_two_states: (Option<StateEvent>, Option<StateEvent>) = (None, None);

            for (event_index, event) in user_txn.events.iter().enumerate() {
                let type_str = event.type_str.as_str();
                let data = event.data.as_str();

                // Only parse events that match an `EmojicoinTypeTag`. This protects against
                // parsing invalid or unexpected JSON data.
                if EmojicoinTypeTag::from_type_str(type_str).is_some() {
                    // If it's an event with a market, parse it and add it to `market_events`
                    // and possibly the one minute periodic state events.
                    if let Some(evt) = EventWithMarket::from_event_type(
                        type_str,
                        data,
                        txn_version,
                        event_index as i64,
                    )? {
                        match &evt {
                            EventWithMarket::State(state) => {
                                candlesticks_builders.extend(
                                    CandlestickDiffModelBuilder::from_state_event(
                                        &txn_info,
                                        state,
                                        (txn_info.version, event_index as i64),
                                    ),
                                );
                                states
                                    .insert(state.market_metadata.market_id.clone(), state.clone());
                                // For arena swaps, we need to track two market states. The market swapped *out of*
                                // and the market swapped *into*. These appear in ascending event index order, because
                                // the market swapped out of is always sold first in `emojicoin_arena::swap`.
                                // Stored in a FIFO queue as: (most_recent, 2nd_most_recent)
                                last_two_states = (Some(state.clone()), last_two_states.0);
                                if let Some(melee_data) = melee_data.as_mut() {
                                    if state.last_swap.nonce == state.state_metadata.market_nonce
                                        && (state.market_metadata.market_id
                                            == melee_data.market_id_0
                                            || state.market_metadata.market_id
                                                == melee_data.market_id_1)
                                    {
                                        if state.market_metadata.market_id == melee_data.market_id_0
                                        {
                                            melee_data.price_0 = state.curve_price();
                                        } else {
                                            melee_data.price_1 = state.curve_price();
                                        };
                                        let candlestick =
                                            ArenaCandlestickDiffModelBuilder::from_state_event(
                                                &txn_info,
                                                melee_data.melee_id.clone(),
                                                state.clone(),
                                                (txn_info.version, event_index as i64),
                                                melee_data.price_0.clone(),
                                                melee_data.price_1.clone(),
                                            );
                                        arena_candlesticks_builders.extend(candlestick);
                                    }
                                }
                            }
                            EventWithMarket::MarketRegistration(mr) => {
                                market_registrations.push(mr.clone());
                            }
                            _ => {}
                        }
                        market_events.push(evt.clone());
                        if let Some(one_min_pse) =
                            RecentOneMinutePeriodicStateEvent::try_from_event(evt, txn_version)
                        {
                            period_data.push(one_min_pse);
                        }
                        // If it's an arena event, parse it and add it to the proper arena events vector.
                    } else if let Some(evt) = ArenaEvent::from_event_type(
                        type_str,
                        data,
                        txn_version,
                        event_index as i64,
                    )? {
                        match evt {
                            ArenaEvent::Melee(melee) => {
                                let model =
                                    ArenaMeleeEventModel::new(txn_info.clone(), melee.clone());
                                let market_0 = get_market_data(
                                    &melee.emojicoin_0_market_address,
                                    market_registrations,
                                    states,
                                    &pool,
                                )
                                .await?;
                                let market_1 = get_market_data(
                                    &melee.emojicoin_1_market_address,
                                    market_registrations,
                                    states,
                                    &pool,
                                )
                                .await?;

                                // Add to melee events
                                insert_events.arena_melee_events.push(model.clone());

                                // Add to leaderboard history. On the first melee, this is None,
                                // because there is no previous leaderboard to snapshot.
                                if let Some(melee_data) = melee_data.as_ref() {
                                    insert_events.arena_leaderboard_history.push(
                                        ArenaLeaderboardHistoryPartialModel::new(
                                            melee_data,
                                            txn_info.version,
                                        ),
                                    );
                                }

                                // Add to arena info.
                                let arena_info_data = ArenaInfoData {
                                    emojicoin_0_market_id: market_0.market_id.clone(),
                                    emojicoin_1_market_id: market_1.market_id.clone(),
                                    emojicoin_0_symbols: market_0.symbol_emojis,
                                    emojicoin_1_symbols: market_1.symbol_emojis,
                                };
                                let arena_info =
                                    ArenaInfoModel::new(&txn_info, model, arena_info_data);
                                insert_events.arena_info.push(arena_info);

                                // Update the melee state.
                                *melee_data = Some(MeleeData {
                                    melee_id: melee.melee_id,
                                    market_id_0: market_0.market_id,
                                    market_id_1: market_1.market_id,
                                    price_0: market_0.price,
                                    price_1: market_1.price,
                                });
                            }
                            ArenaEvent::Enter(enter) => {
                                insert_events.arena_position.push(
                                    ArenaPositionDiffModel::from_enter(&txn_info, enter.clone()),
                                );
                                let model = ArenaEnterEventModel::new(txn_info.clone(), enter);
                                insert_events
                                    .arena_info_update
                                    .push(ArenaInfoDiffUpdate::from(model.clone()));
                                insert_events.arena_enter_events.push(model)
                            }
                            ArenaEvent::Exit(exit) => {
                                insert_events.arena_position.push(
                                    ArenaPositionDiffModel::from_exit(&txn_info, exit.clone()),
                                );
                                let model = ArenaExitEventModel::new(
                                    txn_info.clone(),
                                    exit,
                                    melee_data.as_ref().expect("Exit event should always appear after melee data is loaded in state."),
                                );
                                insert_events
                                    .arena_info_update
                                    .push(ArenaInfoDiffUpdate::from(model.clone()));
                                insert_events.arena_exit_events.push(model)
                            }
                            ArenaEvent::Swap(swap) => {
                                // See the explanation for `last_two_states` above, where it's set.
                                // last_two_states = (most_recent, 2nd_most_recent)
                                // last_two_states = (swapped_into, swapped_out_of)
                                let (swapped_into, swapped_out_of) = (
                                    last_two_states.0.take().expect("The most recent arena state event should be processed already."),
                                    last_two_states.1.take().expect("The less recent arena state event should be processed already."),
                                );
                                // If the balance of `swap.emojicoin_0_proceeds` is zero, it means
                                // emojicoin_0 was swapped out of.
                                let (emojicoin_0, emojicoin_1) =
                                    if swap.emojicoin_0_proceeds.is_zero() {
                                        (swapped_out_of, swapped_into)
                                    } else {
                                        (swapped_into, swapped_out_of)
                                    };
                                insert_events.arena_position.push(
                                    ArenaPositionDiffModel::from_swap(
                                        &txn_info,
                                        swap.clone(),
                                        &emojicoin_0,
                                        &emojicoin_1,
                                    ),
                                );
                                let model = ArenaSwapEventModel::new(
                                    txn_info.clone(),
                                    swap,
                                    melee_data.as_ref().unwrap(),
                                );
                                insert_events.arena_info_update.push(
                                    ArenaInfoDiffUpdate::from_state_events(
                                        model.clone(),
                                        &emojicoin_0,
                                        &emojicoin_1,
                                    ),
                                );
                                insert_events.arena_swap_events.push(model);
                            }
                            ArenaEvent::VaultBalanceUpdate(vault_balance_update) => insert_events
                                .arena_vault_balance_update_events
                                .push(ArenaVaultBalanceUpdateEventModel::new(
                                    txn_info.clone(),
                                    vault_balance_update,
                                )),
                        }
                    // If it's a global state event, parse and add it to the global state events vector.
                    } else if let Some(global_event) =
                        GlobalStateEvent::from_event_type(type_str, data, txn_version)?
                    {
                        insert_events
                            .global_state_events
                            .push(GlobalStateEventModel::new(txn_info.clone(), global_event));
                    }
                }
            }

            // Keep in mind that these are collecting events and changes within the context of a single transaction,
            // not all transactions.
            let mut builders: AHashMap<(u64, u64), EventGroupBuilder> = AHashMap::new();
            for evt in market_events.into_iter() {
                let (market_id, market_nonce) = (evt.get_market_id(), evt.get_market_nonce());
                match builders.get_mut(&(market_id, market_nonce)) {
                    Some(group) => {
                        group.add_event(evt);
                    }
                    None => {
                        builders.insert(
                            (market_id, market_nonce),
                            EventGroupBuilder::new(evt, txn_info.clone()),
                        );
                    }
                };
            }

            for builder in builders.into_values() {
                let EventGroup {
                    market_id,
                    market_nonce,
                    bump_event,
                    state_event,
                    periodic_state_events: periodic_events,
                    txn_info,
                } = builder.build();

                insert_events.periodic_state_events.extend(
                    PeriodicStateEventModel::from_periodic_events(
                        txn_info.clone(),
                        periodic_events,
                        state_event.last_swap.clone(),
                    ),
                );

                let market_addr = &state_event.market_metadata.market_address;

                // A market resource in a transaction changeset will *always* contain the latest
                // market state for that transaction by virtue of the writeset reflecting the
                // final state of the market at the end of the transaction.
                //
                // Thus, the boolean condition to enter the `and_modify` code block below must
                // use `<=` to ensure that in the case where the event with a lower nonce is
                // inserted into the hashmap with `or_insert_with` first, the `latest_trigger`
                // and `latest_instant_stats` are still properly updated.
                //
                // These comparisons remove the need to parse the writeset for every single
                // event and instead only parse it for events that are newer than what's
                // currently in the hashamp for that market.
                latest_market_resources
                    .entry(market_id)
                    .and_modify(
                        |(
                            txn_info_for_latest,
                            latest_resource,
                            latest_trigger,
                            latest_instant_stats,
                        )| {
                            if bigdecimal_to_u64(&latest_resource.sequence_info.nonce)
                                <= market_nonce
                            {
                                // Writeset changes reflect the final state changes from the transaction; same version == same changes.
                                if txn_info_for_latest.version != txn_version {
                                    *latest_resource =
                                        MarketResource::from_write_set_changes(txn, market_addr);
                                    *txn_info_for_latest = txn_info.clone();
                                }
                                *latest_trigger = state_event.state_metadata.trigger;
                                *latest_instant_stats = state_event.instantaneous_stats.clone();
                            }
                        },
                    )
                    .or_insert_with(|| {
                        (
                            txn_info.clone(),
                            MarketResource::from_write_set_changes(txn, market_addr),
                            state_event.state_metadata.trigger,
                            state_event.instantaneous_stats.clone(),
                        )
                    });

                match bump_event {
                    BumpEvent::MarketRegistration(event) => {
                        let mkt_registration_model =
                            MarketRegistrationEventModel::new(txn_info.clone(), event, state_event);
                        insert_events
                            .market_registration_events
                            .push(mkt_registration_model);
                    }
                    BumpEvent::Chat(chat) => {
                        insert_events.chat_events.push(ChatEventModel::new(
                            txn_info.clone(),
                            chat,
                            state_event,
                        ));
                    }
                    BumpEvent::Swap(swap) => {
                        let swap_model = SwapEventModel::new(txn_info.clone(), swap, state_event);
                        insert_events.swap_events.push(swap_model);
                    }
                    BumpEvent::Liquidity(event) => {
                        let market_addr = market_addr.clone();
                        let evt_model =
                            LiquidityEventModel::new(txn_info.clone(), event, state_event);
                        insert_events.liquidity_events.push(evt_model.clone());

                        // Only insert the latest pool activity for a user in this transaction.
                        // That is, if a user interacts multiple times with one pool in one transaction,
                        // only the latest interaction is used to insert/update the user's row for that pool.
                        // Otherwise we'd needlessly overwrite the same row multiple times from one transaction.
                        let key = (
                            evt_model.provider.clone(),
                            bigdecimal_to_u64(&evt_model.market_id),
                        );
                        let new_pool: UserLiquidityPoolsModel =
                            UserLiquidityPoolsModel::from_event_and_writeset(
                                txn,
                                evt_model,
                                &market_addr,
                            );
                        user_pools_db
                            .entry(key)
                            .and_modify(|pool| {
                                if pool.market_nonce < new_pool.market_nonce {
                                    *pool = new_pool.clone();
                                }
                            })
                            .or_insert(new_pool);
                    }
                }
            }
        }

        Ok(())
    }
}

impl EmojicoinProcessor {
    fn name(&self) -> &'static str {
        "emojicoin"
    }

    pub async fn process_transactions(
        &self,
        transactions: Vec<Transaction>,
        pool: ArcDbPool,
    ) -> anyhow::Result<()> {
        if transactions.is_empty() {
            return Ok(());
        }
        let first_transaction_version = transactions.iter().next().unwrap().version;
        let last_transaction = transactions.iter().last().unwrap();
        let last_transaction_version = last_transaction.version;

        let processing_start = std::time::Instant::now();

        let prev_last_success_version = *self.version.read().await;

        let mut insert_events = InsertEvents {
            market_registration_events: vec![],
            swap_events: vec![],
            chat_events: vec![],
            liquidity_events: vec![],
            periodic_state_events: vec![],
            global_state_events: vec![],
            market_latest_state_events: vec![],
            market_1m_periods: vec![],
            user_pools: vec![],
            arena_melee_events: vec![],
            arena_enter_events: vec![],
            arena_exit_events: vec![],
            arena_swap_events: vec![],
            arena_vault_balance_update_events: vec![],
            arena_position: vec![],
            arena_info: vec![],
            arena_leaderboard_history: vec![],
            arena_info_update: vec![],
            arena_candlesticks: vec![],
            candlesticks: vec![],
        };

        // Store the writeset changes for each market in the transaction so we can lazily parse them later only for the
        // latest event for that market. We may get several writeset changes for the same market across all the transactions.
        let mut latest_market_resources: AHashMap<
            u64,
            (TxnInfo, MarketResource, Trigger, InstantaneousStats),
        > = AHashMap::new();
        let mut user_pools_db: AHashMap<(String, u64), UserLiquidityPoolsModel> = AHashMap::new();
        let mut period_data = vec![];
        let mut arena_candlesticks_builders = vec![];
        let mut candlesticks_builders = vec![];

        let mut market_registrations = vec![];
        let mut states: AHashMap<BigDecimal, StateEvent> = AHashMap::new();

        let mut max_transaction_version = prev_last_success_version;

        for txn in &transactions {
            max_transaction_version = std::cmp::max(max_transaction_version, txn.version);
            if txn.version <= prev_last_success_version {
                continue;
            }
            let res = self
                .process_transaction(
                    &pool,
                    txn,
                    &mut user_pools_db,
                    &mut market_registrations,
                    &mut period_data,
                    &mut latest_market_resources,
                    &mut arena_candlesticks_builders,
                    &mut candlesticks_builders,
                    &mut states,
                    &mut insert_events,
                )
                .await;
            res.with_context(|| format!("Could not process transaction {}.", txn.version))?;
        }

        insert_events.user_pools = user_pools_db.into_values().collect_vec();

        insert_events.market_latest_state_events = latest_market_resources
            .into_values()
            .map(|(txn_info, market, trigger, instant_stats)| {
                MarketLatestStateEventModel::from_txn_and_market_resource(
                    txn_info,
                    market,
                    trigger,
                    instant_stats,
                )
            })
            .collect_vec();

        insert_events.market_1m_periods = period_data
            .clone()
            .into_iter()
            .map(|p| p.into())
            .collect_vec();

        insert_events.arena_position = ArenaPositionDiffModel::merge(insert_events.arena_position);

        insert_events.arena_info_update =
            ArenaInfoDiffUpdate::merge(insert_events.arena_info_update);

        insert_events.arena_candlesticks =
            ArenaCandlestickDiffModelBuilder::merge(arena_candlesticks_builders)
                .into_iter()
                .map(|a| a.into())
                .collect();

        insert_events.candlesticks = CandlestickDiffModelBuilder::merge(candlesticks_builders)
            .into_iter()
            .map(|a| a.into())
            .collect();

        let mut all_db_events = vec![
            EmojicoinDbEvent::from_market_registration_events(
                &insert_events.market_registration_events,
            ),
            EmojicoinDbEvent::from_swap_events(&insert_events.swap_events),
            EmojicoinDbEvent::from_chat_events(&insert_events.chat_events),
            EmojicoinDbEvent::from_liquidity_events(&insert_events.liquidity_events),
            EmojicoinDbEvent::from_periodic_state_events(&insert_events.periodic_state_events),
            EmojicoinDbEvent::from_global_state_events(&insert_events.global_state_events),
            EmojicoinDbEvent::from_market_latest_state_events(
                &insert_events.market_latest_state_events,
            ),
            EmojicoinDbEvent::from_arena_melee(&insert_events.arena_melee_events),
            EmojicoinDbEvent::from_arena_enter(&insert_events.arena_enter_events),
            EmojicoinDbEvent::from_arena_exit(&insert_events.arena_exit_events),
            EmojicoinDbEvent::from_arena_swap(&insert_events.arena_swap_events),
            EmojicoinDbEvent::from_arena_vault_balance_update(
                &insert_events.arena_vault_balance_update_events,
            ),
        ]
        .into_iter()
        .flatten()
        .collect_vec();

        let processing_duration = processing_start.elapsed();
        let db_insertion_start = std::time::Instant::now();

        let tx_result = insert_to_db(
            pool,
            self.name(),
            insert_events,
            &self.per_table_chunk_sizes,
            max_transaction_version,
            last_transaction,
        )
        .await;

        let insertion_duration = db_insertion_start.elapsed();
        match tx_result {
            Ok((candlesticks, arena_candlesticks)) => {
                all_db_events.extend(EmojicoinDbEvent::from_arena_candlesticks(
                    &arena_candlesticks,
                ));
                all_db_events.extend(EmojicoinDbEvent::from_candlesticks(&candlesticks));
                self.publish_events(all_db_events);
                *self.version.write().await = max_transaction_version;
                info!(
                    ?processing_duration,
                    ?insertion_duration,
                    first_transaction_version,
                    last_transaction_version,
                    "Succsessfully processed events."
                );
                Ok(())
            }
            Err(e) => Err(anyhow!(e)).with_context(|| {
                format!(
                    "Could not insert events into the db (from {} to {}).",
                    first_transaction_version, last_transaction_version
                )
            }),
        }
    }
}
