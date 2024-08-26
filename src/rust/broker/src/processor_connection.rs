use futures_util::StreamExt;
use log::{error, info, log_enabled, Level};
use processor::emojicoin_dot_fun::EmojicoinDbEvent;
use tokio::sync::broadcast::Sender;
use tokio_tungstenite::connect_async;

pub async fn processor_connection(processor_url: String, tx: Sender<EmojicoinDbEvent>) {
    let mut connection = connect_async(processor_url).await.unwrap();
    info!("Connected to the processor.");
    while let Some(msg) = connection.0.next().await {
        if msg.is_err() {
            error!("Got an error instead of a message: {}", msg.unwrap_err());
            continue;
        }
        let msg = msg.unwrap();
        let msg = msg.to_text();
        if msg.is_err() {
            error!("Could not convert message to text: {}", msg.unwrap_err());
            continue;
        }
        let msg = msg.unwrap();
        let res: Result<EmojicoinDbEvent, _> = serde_json::de::from_str(msg);
        if res.is_err() {
            error!(
                "Could not parse message: error: {}, message: {}",
                res.unwrap_err(),
                msg
            );
            continue;
        }
        let msg = res.unwrap();
        if log_enabled!(Level::Debug) {
            info!("Got message from processor: {msg:?}.");
        } else {
            info!("Got message from processor: {msg}.");
        }
        let _ = tx.send(msg);
    }
    info!("Connection to the processor terminated.");
}
