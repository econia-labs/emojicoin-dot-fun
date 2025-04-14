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

// This static variables are needed in order to work with the new SDK approach.
//
// Since the SDK expects you to pass a function, there is no other (clean) way to pass a stateful
// processor to the function.
//
// For this reason, the channel used to communicate between the processor and the WebSocket server,
// as well as the processor itself are stored in static read write locks behind atomic reference
// counting pointers. This allows the processor and it's state to be accessed by the function
// passed to the SDK.
//
// Since the processor needs to be initialized with an SQL connection, and that it is only
// available inside the SDK function, we do not initialize it here, and use an Option instead.
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
            // Fancy way of accessing the processor. This will ALWAYS run, as if the processor was
            // a None, it would have been set to a Some(_) in the if just above.
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
