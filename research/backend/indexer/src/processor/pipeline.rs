use async_trait::async_trait;
use sqlx::Postgres;

use super::TransactionData;

mod candlestick;
mod chat;
mod event;
mod favorite;
mod liquidity;
mod market;
mod melee;
mod melee_candlestick;
mod position;
mod reserves;
mod swap;
mod vault;

pub use candlestick::CandlestickPipeline;
pub use chat::ChatPipeline;
pub use event::EventPipeline;
pub use favorite::FavoritePipeline;
pub use liquidity::LiquidityPipeline;
pub use market::MarketPipeline;
pub use melee::MeleePipeline;
pub use melee_candlestick::MeleeCandlestickPipeline;
pub use reserves::ReservesPipeline;
pub use position::PositionPipeline;
pub use swap::SwapPipeline;
pub use vault::VaultPipeline;

#[async_trait]
pub trait Pipeline {
    /// Return the name of the processor.
    fn name(&self) -> &'static str;

    /// Process the transaction and update the pipeline in-memory state.
    async fn process(&mut self, transaction: &TransactionData) -> anyhow::Result<()>;

    /// Commit the in-memory pipeline state to the database.
    async fn insert<'e>(
        &mut self,
        db_tx: &mut sqlx::Transaction<'e, Postgres>,
    ) -> anyhow::Result<()>;
}
