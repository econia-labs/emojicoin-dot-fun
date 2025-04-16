use async_trait::async_trait;
use bigdecimal::{BigDecimal, FromPrimitive};
use chrono::{DateTime, Utc};
use sdk::{Event, emojicoin::events::EmojicoinEvent, scn::Scn};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

struct Builder {
    transaction_version: BigDecimal,
    event_index: BigDecimal,
    timestamp: DateTime<Utc>,
    codepoints: String,
    nonce: BigDecimal,
    sender: String,
    message: String,
    emojicoin_balance: BigDecimal,
    supply: BigDecimal,
}

/// Pipeline that updates the chat table.
pub struct ChatPipeline {
    builders: Vec<Builder>,
}

impl ChatPipeline {
    pub fn new() -> Self {
        Self { builders: vec![] }
    }
}

#[async_trait]
impl Pipeline for ChatPipeline {
    fn name(&self) -> &'static str {
        "chat"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for (index, event) in transaction.events.iter().enumerate() {
            if let Event::Emojicoin(EmojicoinEvent::Chat(chat)) = event {
                let seconds = chat.emit_time / 1_000_000;
                let rest = chat.emit_time % 1_000_000;
                let timestamp =
                    DateTime::<Utc>::from_timestamp(seconds as i64, rest as u32).unwrap();
                let builder = Builder {
                    transaction_version: transaction.version.clone(),
                    event_index: BigDecimal::from_usize(index).unwrap(),
                    timestamp,
                    codepoints: chat.scn(),
                    nonce: BigDecimal::from(chat.emit_market_nonce),
                    sender: chat.user.clone(),
                    message: chat.message.clone(),
                    emojicoin_balance: BigDecimal::from(chat.user_emojicoin_balance),
                    supply: BigDecimal::from(chat.circulating_supply),
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
            query!(
                r#"
                    INSERT INTO chat (
                        transaction_version,
                        event_index,
                        timestamp,
                        codepoints,
                        nonce,
                        sender,
                        message,
                        emojicoin_balance,
                        supply
                    )
                    VALUES (
                         $1, $2, $3, $4, $5, $6, $7, $8, $9
                    )
                "#,
                builder.transaction_version,
                builder.event_index,
                builder.timestamp,
                builder.codepoints,
                builder.nonce,
                builder.sender,
                builder.message,
                builder.emojicoin_balance,
                builder.supply,
            )
            .execute(&mut **db_tx)
            .await?;
        }

        Ok(())
    }
}
