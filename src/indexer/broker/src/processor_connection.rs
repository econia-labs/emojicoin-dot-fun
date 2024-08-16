use futures_util::StreamExt;
use processor::emojicoin_dot_fun::EmojicoinEvent;
use tokio::sync::broadcast::Sender;
use tokio_tungstenite::connect_async;

pub async fn processor_connection(processor_url: String, tx: Sender<EmojicoinEvent>) {
    let mut connection = connect_async(processor_url).await.unwrap();
    while let Some(msg) = connection.0.next().await {
        if msg.is_err() {
            log::error!("Got an error instead of a message: {}", msg.unwrap_err());
            continue;
        }
        let msg = msg.unwrap();
        let msg = msg.to_text();
        if msg.is_err() {
            log::error!("Could not convert message to text: {}", msg.unwrap_err());
            continue;
        }
        let msg = msg.unwrap();
        let res: Result<EmojicoinEvent, _> = serde_json::de::from_str(msg);
        if res.is_err() {
            log::error!(
                "Could not parse message: error: {}, message: {}",
                res.unwrap_err(),
                msg
            );
            continue;
        }
        let msg = res.unwrap();
        let _ = tx.send(msg);
    }
}
