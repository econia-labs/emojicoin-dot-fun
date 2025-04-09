use std::sync::{Arc, LazyLock};

use ahash::AHashMap;
use aptos_indexer_processor_sdk::postgres::basic_processor::process;
use processor::db::utils::MIGRATIONS;
use processor::emojicoin_dot_fun::EmojicoinDbEvent;
use processor::processor::EmojicoinProcessor;
use tokio::sync::{
    mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender},
    RwLock,
};

static CHANNEL: LazyLock<(
    RwLock<UnboundedSender<EmojicoinDbEvent>>,
    Arc<RwLock<UnboundedReceiver<EmojicoinDbEvent>>>,
)> = LazyLock::new(|| {
    let (sender, receiver) = unbounded_channel();
    (RwLock::new(sender), Arc::new(RwLock::new(receiver)))
});
static PROCESSOR: LazyLock<RwLock<Option<EmojicoinProcessor>>> =
    LazyLock::new(|| RwLock::new(None));

mod ws_server;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let ws_future = ws_server::start(CHANNEL.1.clone());
    let process_future = process(
        "emojicoin".to_string(),
        MIGRATIONS,
        async |transactions, conn_pool| {
            let mut processor = PROCESSOR.write().await;
            if processor.is_none() {
                *processor = Some(
                    EmojicoinProcessor::new(
                        conn_pool.clone(),
                        AHashMap::new(),
                        CHANNEL.0.read().await.clone(),
                    )
                    .await
                    .unwrap(),
                )
            }
            if let Some(processor) = &*processor {
                processor
                    .process_transactions(transactions, conn_pool)
                    .await
                    .unwrap();
            }
            Ok(())
        },
    );
    tokio::try_join!(ws_future, process_future).map(|_| ())
}
