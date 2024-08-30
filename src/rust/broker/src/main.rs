use std::sync::Arc;

use log::{error, info};
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, RwLock};

mod processor_connection;
mod server;
mod types;
mod util;

const CHANNEL_BUFFER_SIZE: usize = 2048;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum HealthStatus {
    Starting,
    Ok,
    Sick,
    Dead,
}

#[tokio::main]
async fn main() -> Result<(), ()> {
    env_logger::init();

    let processor_url = std::env::var("PROCESSOR_WS_URL")
        .expect("Environment variable PROCESSOR_WS_URL is not set.");
    let port: u16 = std::env::var("PORT")
        .expect("Environment variable PORT is not set.")
        .parse()
        .expect("Environment variable PORT is not a valid port.");

    let (tx, _) = broadcast::channel(CHANNEL_BUFFER_SIZE);
    let tx2 = tx.clone();

    let processor_connection_health = Arc::new(RwLock::new(HealthStatus::Starting));

    let processor_connection = tokio::spawn(processor_connection::start(
        processor_url,
        tx2,
        processor_connection_health.clone(),
    ));

    let mut sse_server = tokio::spawn(server::server(tx, port, processor_connection_health));

    tokio::select! {
        _ = processor_connection => {
            error!("Processor connection thread terminated.");
            return Err(());
        }
        result = &mut sse_server => {
            if let Err(e) = result {
                error!("Broker server error: {e}.");
                return Err(());
            } else {
                info!("Gracefully shutting down.")
            }
        }
    };

    Ok(())
}
