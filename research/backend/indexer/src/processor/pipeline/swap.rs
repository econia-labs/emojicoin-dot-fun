use async_trait::async_trait;
use bigdecimal::{BigDecimal, FromPrimitive};
use chrono::{DateTime, Utc};
use sdk::{Event, emojicoin::events::EmojicoinEvent, util::unq64};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

struct Builder {
    transaction_version: BigDecimal,
    event_index: BigDecimal,
    timestamp: DateTime<Utc>,
    market_id: BigDecimal,
    nonce: BigDecimal,
    sender: String,
    input_amount: BigDecimal,
    net_proceeds: BigDecimal,
    is_sell: bool,
    average_price: BigDecimal,
    integrator_fees: BigDecimal,
    pool_fees: BigDecimal,
    volume_base: BigDecimal,
    volume_quote: BigDecimal,
}

/// Pipeline that updates the swap table.
pub struct SwapPipeline {
    builders: Vec<Builder>,
}

impl SwapPipeline {
    pub fn new() -> Self {
        Self { builders: vec![] }
    }
}

#[async_trait]
impl Pipeline for SwapPipeline {
    fn name(&self) -> &'static str {
        "swap"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for (index, event) in transaction.events.iter().enumerate() {
            if let Event::Emojicoin(EmojicoinEvent::Swap(swap)) = event {
                let seconds = swap.time / 1_000_000;
                let rest = swap.time % 1_000_000;
                let timestamp =
                    DateTime::<Utc>::from_timestamp(seconds as i64, rest as u32).unwrap();
                let builder = Builder {
                    transaction_version: transaction.version.clone(),
                    event_index: BigDecimal::from_usize(index).unwrap(),
                    timestamp,
                    market_id: BigDecimal::from(swap.market_id),
                    nonce: BigDecimal::from(swap.market_nonce),
                    sender: swap.swapper.clone(),
                    input_amount: BigDecimal::from(swap.input_amount),
                    net_proceeds: BigDecimal::from(swap.net_proceeds),
                    is_sell: swap.is_sell,
                    average_price: unq64(swap.avg_execution_price_q64),
                    integrator_fees: BigDecimal::from(swap.integrator_fee),
                    pool_fees: BigDecimal::from(swap.pool_fee),
                    volume_base: BigDecimal::from(swap.base_volume),
                    volume_quote: BigDecimal::from(swap.quote_volume),
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
                    INSERT INTO swap (
                        transaction_version,
                        event_index,
                        timestamp,
                        codepoints,
                        nonce,
                        sender,
                        input_amount,
                        net_proceeds,
                        is_sell,
                        average_price,
                        integrator_fees,
                        pool_fees,
                        volume_base,
                        volume_quote
                    )
                    SELECT $1, $2, $3, (SELECT codepoints FROM market WHERE market_id = $4), $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                "#,
                builder.transaction_version,
                builder.event_index,
                builder.timestamp,
                builder.market_id,
                builder.nonce,
                builder.sender,
                builder.input_amount,
                builder.net_proceeds,
                builder.is_sell,
                builder.average_price,
                builder.integrator_fees,
                builder.pool_fees,
                builder.volume_base,
                builder.volume_quote,
            )
            .execute(&mut **db_tx)
            .await?;
        }

        Ok(())
    }
}
