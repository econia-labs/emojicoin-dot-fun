use async_trait::async_trait;
use bigdecimal::BigDecimal;
use sdk::{Event, arena::events::ArenaEvent};
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

/// Pipeline that updates the vault balance table.
pub struct VaultPipeline {
    balance: Option<BigDecimal>,
}

impl VaultPipeline {
    pub fn new() -> Self {
        Self { balance: None }
    }
}

#[async_trait]
impl Pipeline for VaultPipeline {
    fn name(&self) -> &'static str {
        "vault"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for event in &transaction.events {
            if let Event::Arena(ArenaEvent::VaultBalanceUpdate(update)) = event {
                let balance = BigDecimal::from(update.new_balance);
                self.balance = Some(balance);
            }
        }
        Ok(())
    }

    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()> {
        let mut balance = None;
        std::mem::swap(&mut balance, &mut self.balance);
        if let Some(balance) = balance {
            query!("UPDATE arena_reward_vault SET balance = $1", balance)
                .execute(&mut **db_tx)
                .await?;
        }

        Ok(())
    }
}
