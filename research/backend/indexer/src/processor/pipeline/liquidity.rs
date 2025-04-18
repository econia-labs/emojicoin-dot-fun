use async_trait::async_trait;
use bigdecimal::{BigDecimal, FromPrimitive};
use chrono::{DateTime, Utc};
use sdk::{Event, emojicoin::events::EmojicoinEvent};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

struct Builder {
    transaction_version: BigDecimal,
    event_index: BigDecimal,
    block: BigDecimal,
    timestamp: DateTime<Utc>,
    market_id: BigDecimal,
    nonce: BigDecimal,
    sender: String,
    base_amount: BigDecimal,
    quote_amount: BigDecimal,
    lp_coin_amount: BigDecimal,
    liquidity_provided: bool,
    base_donation_claim_amount: BigDecimal,
    quote_donation_claim_amount: BigDecimal,
}

/// Pipeline that updates the liquidity table.
pub struct LiquidityPipeline {
    builders: Vec<Builder>,
}

impl LiquidityPipeline {
    pub fn new() -> Self {
        Self { builders: vec![] }
    }
}

#[async_trait]
impl Pipeline for LiquidityPipeline {
    fn name(&self) -> &'static str {
        "liquidity"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for (index, event) in transaction.events.iter().enumerate() {
            if let Event::Emojicoin(EmojicoinEvent::Liquidity(liquidity)) = event {
                let seconds = liquidity.time / 1_000_000;
                let rest = liquidity.time % 1_000_000;
                let timestamp =
                    DateTime::<Utc>::from_timestamp(seconds as i64, rest as u32).unwrap();
                let builder = Builder {
                    transaction_version: transaction.version.clone(),
                    event_index: BigDecimal::from_usize(index).unwrap(),
                    block: transaction.block.clone(),
                    timestamp,
                    market_id: BigDecimal::from(liquidity.market_id),
                    nonce: BigDecimal::from(liquidity.market_nonce),
                    sender: liquidity.provider.clone(),
                    base_amount: BigDecimal::from(liquidity.base_amount),
                    quote_amount: BigDecimal::from(liquidity.quote_amount),
                    lp_coin_amount: BigDecimal::from(liquidity.lp_coin_amount),
                    base_donation_claim_amount: BigDecimal::from(liquidity.base_donation_claim_amount),
                    quote_donation_claim_amount: BigDecimal::from(liquidity.quote_donation_claim_amount),
                    liquidity_provided: liquidity.liquidity_provided,
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
                    INSERT INTO liquidity (
                        transaction_version,
                        event_index,
                        block,
                        timestamp,
                        codepoints,
                        nonce,
                        sender,
                        base_amount,
                        quote_amount,
                        lp_coin_amount,
                        base_donation_claim_amount,
                        quote_donation_claim_amount,
                        liquidity_provided
                    )
                    SELECT $1, $2, $3, $4, (SELECT codepoints FROM market WHERE market_id = $5), $6, $7, $8, $9, $10, $11, $12, $13
                "#,
                builder.transaction_version,
                builder.event_index,
                builder.block,
                builder.timestamp,
                builder.market_id,
                builder.nonce,
                builder.sender,
                builder.base_amount,
                builder.quote_amount,
                builder.lp_coin_amount,
                builder.base_donation_claim_amount,
                builder.quote_donation_claim_amount,
                builder.liquidity_provided,
            )
            .execute(&mut **db_tx)
            .await?;
        }

        Ok(())
    }
}
