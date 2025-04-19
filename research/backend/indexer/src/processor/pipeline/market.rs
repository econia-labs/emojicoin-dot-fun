use std::collections::HashMap;

use async_trait::async_trait;
use bigdecimal::BigDecimal;
use chrono::DateTime;
use sdk::{
    Event,
    emojicoin::events::{EmojicoinEvent, MarketRegistration, PeriodicState, State},
    scn::Scn,
    util::unq64,
};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

struct Builder {
    market_registration: Option<MarketRegistration>,
    registration_version: Option<BigDecimal>,
    registration_block: Option<BigDecimal>,
    state: State,
    daily_percentage_return: Option<BigDecimal>,
}

/// Pipeline that updates the market table.
pub struct MarketPipeline {
    builders: HashMap<String, Builder>,
}

impl MarketPipeline {
    pub fn new() -> Self {
        Self {
            builders: HashMap::new(),
        }
    }
}

#[async_trait]
impl Pipeline for MarketPipeline {
    fn name(&self) -> &'static str {
        "market"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        let mut market_registrations: HashMap<u64, MarketRegistration> = HashMap::new();
        let mut states = vec![];
        let mut periodic_states: HashMap<(u64, u64), PeriodicState> = HashMap::new();
        for event in &transaction.events {
            match event {
                Event::Emojicoin(EmojicoinEvent::MarketRegistration(market_reg)) => {
                    market_registrations
                        .insert(market_reg.market_metadata.market_id, market_reg.clone());
                }
                Event::Emojicoin(EmojicoinEvent::State(state)) => {
                    states.push(state.clone());
                }
                Event::Emojicoin(EmojicoinEvent::PeriodicState(state)) => {
                    periodic_states.insert(
                        (
                            state.market_metadata.market_id,
                            state.periodic_state_metadata.period,
                        ),
                        state.clone(),
                    );
                }
                _ => {}
            }
        }
        for state in states {
            let daily_periodic_state =
                periodic_states.get(&(state.market_metadata.market_id, 86400000000u64));
            let daily_percentage_return = daily_periodic_state
                .map(|daily_periodic_state| unq64(daily_periodic_state.tvl_per_lp_coin_growth_q64));
            let market_registration = market_registrations
                .get(&state.market_metadata.market_id)
                .cloned();
            let builder = Builder {
                registration_version: if market_registration.is_some() {
                    Some(transaction.version.clone())
                } else {
                    None
                },
                registration_block: if market_registration.is_some() {
                    Some(transaction.block.clone())
                } else {
                    None
                },
                market_registration,
                daily_percentage_return,
                state,
            };
            self.builders
                .entry(builder.state.scn())
                .and_modify(|e| {
                    e.state = builder.state.clone();
                    e.daily_percentage_return = builder.daily_percentage_return.clone();
                })
                .or_insert(builder);
        }
        Ok(())
    }

    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()> {
        let mut builders = HashMap::new();
        std::mem::swap(&mut builders, &mut self.builders);
        for builder in builders.into_values() {
            let state = builder.state;
            let daily_percentage_return = builder.daily_percentage_return;
            if let Some(market_reg) = builder.market_registration {
                let datetime = DateTime::from_timestamp(
                    (market_reg.time / 1_000_000) as i64,
                    (market_reg.time % 1_000_000) as u32,
                );
                query!(
                    r#"
                        INSERT INTO market (
                            codepoints,
                            creator,
                            creation_timestamp,
                            creation_transaction,
                            creation_block,
                            codepoints_array,
                            reserves_cpamm_base,
                            reserves_cpamm_quote,
                            reserves_clamm_base,
                            reserves_clamm_quote,
                            volume_base,
                            volume_quote,
                            pool_fees_base,
                            pool_fees_quote,
                            swaps,
                            chats,
                            daily_percentage_return,
                            fully_diluted_value,
                            integrator_fees,
                            last_swap_quote_volume,
                            lp_coin_supply,
                            market_cap,
                            total_quote_locked,
                            total_value_locked,
                            address,
                            market_id
                        ) VALUES (
                            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                        )
                    "#,
                    state.scn(),
                    market_reg.registrant,
                    datetime,
                    builder.registration_version.unwrap(),
                    builder.registration_block.unwrap(),
                    &state.codepoints(),
                    BigDecimal::from(state.cpamm_real_reserves.base),
                    BigDecimal::from(state.cpamm_real_reserves.quote),
                    BigDecimal::from(state.clamm_virtual_reserves.base),
                    BigDecimal::from(state.clamm_virtual_reserves.quote),
                    BigDecimal::from(state.cumulative_stats.base_volume),
                    BigDecimal::from(state.cumulative_stats.quote_volume),
                    BigDecimal::from(state.cumulative_stats.pool_fees_base),
                    BigDecimal::from(state.cumulative_stats.pool_fees_quote),
                    BigDecimal::from(state.cumulative_stats.n_swaps),
                    BigDecimal::from(state.cumulative_stats.n_chat_messages),
                    daily_percentage_return,
                    BigDecimal::from(state.instantaneous_stats.fully_diluted_value),
                    BigDecimal::from(state.cumulative_stats.integrator_fees),
                    BigDecimal::from(state.last_swap.quote_volume),
                    BigDecimal::from(state.lp_coin_supply),
                    BigDecimal::from(state.instantaneous_stats.market_cap),
                    BigDecimal::from(state.instantaneous_stats.total_quote_locked),
                    BigDecimal::from(state.instantaneous_stats.total_value_locked),
                    state.market_metadata.market_address,
                    BigDecimal::from(state.market_metadata.market_id),
                ).execute(&mut **db_tx).await?;
            } else {
                query!(
                    r#"
                        UPDATE market
                        SET
                            reserves_cpamm_base = $2,
                            reserves_cpamm_quote = $3,
                            reserves_clamm_base = $4,
                            reserves_clamm_quote = $5,
                            volume_base = $6,
                            volume_quote = $7,
                            pool_fees_base = $8,
                            pool_fees_quote = $9,
                            swaps = $10,
                            chats = $11,
                            daily_percentage_return = COALESCE($12, market.daily_percentage_return),
                            fully_diluted_value = $13,
                            integrator_fees = $14,
                            last_swap_quote_volume = $15,
                            lp_coin_supply = $16,
                            market_cap = $17,
                            total_quote_locked = $18,
                            total_value_locked = $19
                        WHERE codepoints = $1
                    "#,
                    state.scn(),
                    BigDecimal::from(state.cpamm_real_reserves.base),
                    BigDecimal::from(state.cpamm_real_reserves.quote),
                    BigDecimal::from(state.clamm_virtual_reserves.base),
                    BigDecimal::from(state.clamm_virtual_reserves.quote),
                    BigDecimal::from(state.cumulative_stats.base_volume),
                    BigDecimal::from(state.cumulative_stats.quote_volume),
                    BigDecimal::from(state.cumulative_stats.pool_fees_base),
                    BigDecimal::from(state.cumulative_stats.pool_fees_quote),
                    BigDecimal::from(state.cumulative_stats.n_swaps),
                    BigDecimal::from(state.cumulative_stats.n_chat_messages),
                    daily_percentage_return,
                    BigDecimal::from(state.instantaneous_stats.fully_diluted_value),
                    BigDecimal::from(state.cumulative_stats.integrator_fees),
                    BigDecimal::from(state.last_swap.quote_volume),
                    BigDecimal::from(state.lp_coin_supply),
                    BigDecimal::from(state.instantaneous_stats.market_cap),
                    BigDecimal::from(state.instantaneous_stats.total_quote_locked),
                    BigDecimal::from(state.instantaneous_stats.total_value_locked),
                )
                .execute(&mut **db_tx)
                .await?;
            }
        }
        Ok(())
    }
}
