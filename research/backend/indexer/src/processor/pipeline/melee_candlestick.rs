use std::collections::HashMap;

use async_trait::async_trait;
use bigdecimal::BigDecimal;
use chrono::{DateTime, DurationRound, Utc};
use sdk::{Event, arena::events::ArenaEvent};
use sqlx::{Postgres, query};

use crate::db::CandlestickDuration;

use super::{Pipeline, TransactionData};

#[derive(Clone)]
struct Builder {
    melee_id: BigDecimal,
    start: DateTime<Utc>,
    duration: CandlestickDuration,
    open: BigDecimal,
    close: BigDecimal,
    low: BigDecimal,
    high: BigDecimal,
}

/// Pipeline that updates the melee candlestick table.
pub struct MeleeCandlestickPipeline {
    builders: HashMap<(BigDecimal, CandlestickDuration, DateTime<Utc>), Builder>,
}

impl MeleeCandlestickPipeline {
    pub fn new() -> Self {
        Self {
            builders: HashMap::new(),
        }
    }
}

#[async_trait]
impl Pipeline for MeleeCandlestickPipeline {
    fn name(&self) -> &'static str {
        "melee_candlestick"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for event in &transaction.events {
            match event {
                Event::Arena(ArenaEvent::Enter(enter)) => {
                    for duration in CandlestickDuration::all() {
                        let time_delta = duration.time_delta();
                        let candlestick_start_time =
                            transaction.timestamp.duration_trunc(time_delta)?;
                        let price_emojicoin_0 = enter.emojicoin_0_exchange_rate.price();
                        let price_emojicoin_1 = enter.emojicoin_1_exchange_rate.price();
                        let price = price_emojicoin_0 / price_emojicoin_1;
                        let melee_id = BigDecimal::from(enter.melee_id);
                        self.builders
                            .entry((melee_id.clone(), duration, candlestick_start_time))
                            .and_modify(|b| {
                                b.high = price.clone().max(b.high.clone());
                                b.low = price.clone().min(b.low.clone());
                                b.close = price.clone();
                            })
                            .or_insert(Builder {
                                melee_id,
                                start: candlestick_start_time,
                                duration,
                                open: price.clone(),
                                close: price.clone(),
                                low: price.clone(),
                                high: price,
                            });
                    }
                }
                Event::Arena(ArenaEvent::Swap(swap)) => {
                    for duration in CandlestickDuration::all() {
                        let time_delta = duration.time_delta();
                        let candlestick_start_time =
                            transaction.timestamp.duration_trunc(time_delta)?;
                        let price_emojicoin_0 = swap.emojicoin_0_exchange_rate.price();
                        let price_emojicoin_1 = swap.emojicoin_1_exchange_rate.price();
                        let price = price_emojicoin_0 / price_emojicoin_1;
                        let melee_id = BigDecimal::from(swap.melee_id);
                        self.builders
                            .entry((melee_id.clone(), duration, candlestick_start_time))
                            .and_modify(|b| {
                                b.high = price.clone().max(b.high.clone());
                                b.low = price.clone().min(b.low.clone());
                                b.close = price.clone();
                            })
                            .or_insert(Builder {
                                melee_id,
                                start: candlestick_start_time,
                                duration,
                                open: price.clone(),
                                close: price.clone(),
                                low: price.clone(),
                                high: price,
                            });
                    }
                }
                _ => {}
            }
        }
        Ok(())
    }

    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()> {
        let mut builders_map: HashMap<(BigDecimal, CandlestickDuration, DateTime<Utc>), Builder> =
            HashMap::new();
        std::mem::swap(&mut builders_map, &mut self.builders);
        let builders = builders_map.into_values();
        for builder in builders {
            query!(
                r#"
                    INSERT INTO melee_candlestick (
                        melee_id,
                        start,
                        duration,
                        open,
                        close,
                        low,
                        high
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7
                    )
                    ON CONFLICT (melee_id, duration, start)
                    DO UPDATE
                    SET
                        close = $5,
                        low = LEAST(melee_candlestick.low, $6),
                        high = GREATEST(melee_candlestick.high, $7)
                "#,
                builder.melee_id,
                builder.start,
                builder.duration as _,
                builder.open,
                builder.close,
                builder.low,
                builder.high,
            )
            .execute(&mut **db_tx)
            .await?;
        }
        Ok(())
    }
}
