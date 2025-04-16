use std::collections::HashMap;

use async_trait::async_trait;
use sdk::Event;
use sqlx::{Postgres, query};

use super::{Pipeline, TransactionData};

/// Pipeline that updates the favorite table.
pub struct FavoritePipeline {
    builders: HashMap<(String, String), bool>,
}

impl FavoritePipeline {
    pub fn new() -> Self {
        Self {
            builders: HashMap::new(),
        }
    }
}

#[async_trait]
impl Pipeline for FavoritePipeline {
    fn name(&self) -> &'static str {
        "favorite"
    }

    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()> {
        for event in &transaction.events {
            if let Event::Favorites(favorite) = event {
                self.builders.insert(
                    (favorite.user.clone(), favorite.market.clone()),
                    favorite.is_favorite,
                );
            }
        }
        Ok(())
    }

    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()> {
        let mut builders = HashMap::new();
        std::mem::swap(&mut builders, &mut self.builders);
        for ((sender, market_address), is_favorite) in builders.into_iter() {
            if is_favorite {
                query!(
                    "DELETE FROM favorite WHERE sender = $1 AND codepoints = (SELECT codepoints FROM market WHERE address = $2)",
                    sender,
                    market_address,
                ).execute(&mut **db_tx).await?;
            } else {
                query!(
                    r#"
                        INSERT INTO favorite (
                            sender,
                            codepoints
                        )
                        SELECT $1, (SELECT codepoints FROM market WHERE address = $2)
                    "#,
                    sender,
                    market_address,
                )
                .execute(&mut **db_tx)
                .await?;
            }
        }
        Ok(())
    }
}
