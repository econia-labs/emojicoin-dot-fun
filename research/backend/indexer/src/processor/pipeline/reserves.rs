use async_trait::async_trait;
use bigdecimal::{BigDecimal, FromPrimitive};
use chrono::{DateTime, Utc};
use sdk::{emojicoin::events::EmojicoinEvent, scn::Scn, Event};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

struct Builder {
    transaction_version: BigDecimal,
    event_index: BigDecimal,
    block: BigDecimal,
    timestamp: DateTime<Utc>,
    codepoints: String,
    clamm_base: BigDecimal,
    clamm_quote: BigDecimal,
    cpamm_base: BigDecimal,
    cpamm_quote: BigDecimal,
    lp_coin_supply: BigDecimal,
}

/// Pipeline that updates the reserves table.
pub struct ReservesPipeline {
    builders: Vec<Builder>,
}

impl ReservesPipeline {
    pub fn new() -> Self {
        Self { builders: vec![] }
    }
}

#[async_trait]
impl Pipeline for ReservesPipeline {
    fn name(&self) -> &'static str {
        "reserves"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for (index, event) in transaction.events.iter().enumerate() {
            if let Event::Emojicoin(EmojicoinEvent::State(state)) = event {
                // Don't add a reserves entry on chat.
                if state.state_metadata.trigger == 6 {
                    continue;
                }
                let builder = Builder {
                    transaction_version: transaction.version.clone(),
                    // The event index of the actual Swap or Liquidity event, not the State event
                    event_index: BigDecimal::from_usize(index - 1).unwrap(),
                    block: transaction.block.clone(),
                    timestamp: transaction.timestamp,
                    codepoints: state.scn(),
                    clamm_base: BigDecimal::from(state.clamm_virtual_reserves.base),
                    clamm_quote: BigDecimal::from(state.clamm_virtual_reserves.quote),
                    cpamm_base: BigDecimal::from(state.cpamm_real_reserves.base),
                    cpamm_quote: BigDecimal::from(state.cpamm_real_reserves.quote),
                    lp_coin_supply: BigDecimal::from(state.lp_coin_supply),
                };
                self.builders.push(builder);
            }
        }
        Ok(())
    }

    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()> {
        let mut builders = vec![];
        std::mem::swap(&mut builders, &mut self.builders);
        for builder in builders {
            query!(r#"
                    INSERT INTO reserves (
                        transaction_version,
                        event_index,
                        block,
                        timestamp,
                        codepoints,
                        clamm_base,
                        clamm_quote,
                        cpamm_base,
                        cpamm_quote,
                        lp_coin_supply
                    )
                    SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
                "#,
                builder.transaction_version,
                builder.event_index,
                builder.block,
                builder.timestamp,
                builder.codepoints,
                builder.clamm_base,
                builder.clamm_quote,
                builder.cpamm_base,
                builder.cpamm_quote,
                builder.lp_coin_supply,
            )
            .execute(&mut **db_tx)
            .await?;
        }

        Ok(())
    }
}
