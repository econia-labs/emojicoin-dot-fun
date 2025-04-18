use bigdecimal::{BigDecimal, FromPrimitive};
use chrono::{DateTime, Utc};
use sdk::{arena::events::ArenaEvent, emojicoin::events::EmojicoinEvent};
use serde_json::Value;
use sqlx::{Postgres, query};

use crate::db::EventType;

use super::{Pipeline, TransactionData};

struct Builder {
    transaction_version: BigDecimal,
    event_index: BigDecimal,
    block: BigDecimal,
    timestamp: DateTime<Utc>,
    event_type: EventType,
    json_value: Value,
}

/// Pipeline that extracts all the events from a transaction.
pub struct EventPipeline {
    builders: Vec<Builder>,
}

impl EventPipeline {
    pub fn new() -> Self {
        Self { builders: vec![] }
    }
}

#[async_trait::async_trait]
impl Pipeline for EventPipeline {
    fn name(&self) -> &'static str {
        "event"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for (index, event) in transaction.events.iter().enumerate() {
            let json_value = serde_json::to_value(event).unwrap();
            let event_index = BigDecimal::from_usize(index).unwrap();
            let event_type = match &event {
                sdk::Event::Arena(arena_event) => match arena_event {
                    ArenaEvent::Melee(_) => EventType::Melee,
                    ArenaEvent::Enter(_) => EventType::ArenaEnter,
                    ArenaEvent::Exit(_) => EventType::ArenaExit,
                    ArenaEvent::Swap(_) => EventType::ArenaSwap,
                    ArenaEvent::VaultBalanceUpdate(_) => EventType::ArenaVaultBalanceUpdate,
                },
                sdk::Event::Emojicoin(emojicoin_event) => match emojicoin_event {
                    EmojicoinEvent::GlobalState(_) => EventType::GlobalState,
                    EmojicoinEvent::State(_) => EventType::State,
                    EmojicoinEvent::PeriodicState(_) => EventType::PeriodicState,
                    EmojicoinEvent::MarketRegistration(_) => EventType::MarketRegistration,
                    EmojicoinEvent::Swap(_) => EventType::Swap,
                    EmojicoinEvent::Chat(_) => EventType::Chat,
                    EmojicoinEvent::Liquidity(_) => EventType::Liquidity,
                },
                sdk::Event::Favorites(_) => EventType::Favorite,
            };
            let builder = Builder {
                transaction_version: transaction.version.clone(),
                event_index,
                block: transaction.block.clone(),
                timestamp: transaction.timestamp,
                event_type,
                json_value,
            };
            self.builders.push(builder);
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
                "INSERT INTO event VALUES ($1, $2, $3, $4, $5, $6)",
                builder.transaction_version,
                builder.event_index,
                builder.block,
                builder.timestamp,
                builder.event_type as _,
                builder.json_value
            )
            .execute(&mut **db_tx)
            .await?;
        }
        Ok(())
    }
}
