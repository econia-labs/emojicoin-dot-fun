use std::collections::HashMap;

use async_trait::async_trait;
use bigdecimal::BigDecimal;
use chrono::{DateTime, DurationRound, Utc};
use sdk::{Event, emojicoin::events::EmojicoinEvent, scn::Scn};
use sqlx::{Postgres, query};

use crate::db::CandlestickDuration;

use super::{Pipeline, TransactionData};

#[derive(Clone)]
struct Builder {
    codepoints: String,
    start: DateTime<Utc>,
    duration: CandlestickDuration,
    open: BigDecimal,
    close: BigDecimal,
    low: BigDecimal,
    high: BigDecimal,
}

/// Pipeline that updates the candlestick table.
pub struct CandlestickPipeline {
    builders: HashMap<(String, CandlestickDuration, DateTime<Utc>), Builder>,
}

impl CandlestickPipeline {
    pub fn new() -> Self {
        Self {
            builders: HashMap::new(),
        }
    }
}

#[async_trait]
impl Pipeline for CandlestickPipeline {
    fn name(&self) -> &'static str {
        "candlestick"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for event in &transaction.events {
            if let Event::Emojicoin(EmojicoinEvent::State(state)) = event {
                for duration in CandlestickDuration::all() {
                    let time_delta = duration.time_delta();
                    let candlestick_start_time =
                        transaction.timestamp.duration_trunc(time_delta)?;
                    let price = state.price();
                    self.builders
                        .entry((state.scn(), duration, candlestick_start_time))
                        .and_modify(|b| {
                            b.high = price.clone().max(b.high.clone());
                            b.low = price.clone().min(b.low.clone());
                            b.close = price.clone();
                        })
                        .or_insert(Builder {
                            codepoints: state.scn(),
                            start: candlestick_start_time,
                            duration,
                            open: state.price(),
                            close: state.price(),
                            low: state.price(),
                            high: state.price(),
                        });
                }
            }
        }
        Ok(())
    }

    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()> {
        let mut builders_map: HashMap<(String, CandlestickDuration, DateTime<Utc>), Builder> =
            HashMap::new();
        std::mem::swap(&mut builders_map, &mut self.builders);
        let builders = builders_map.into_values();
        for builder in builders {
            query!(
                r#"
                    INSERT INTO candlestick (
                        codepoints,
                        start,
                        duration,
                        open,
                        close,
                        low,
                        high
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7
                    )
                    ON CONFLICT (codepoints, duration, start)
                    DO UPDATE
                    SET
                        close = $5,
                        low = LEAST(candlestick.low, $6),
                        high = GREATEST(candlestick.high, $7)
                "#,
                builder.codepoints,
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
