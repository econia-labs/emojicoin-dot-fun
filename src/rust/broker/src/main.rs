use log::{error, info};
use tokio::sync::broadcast;

mod processor_connection;
mod server;
mod types;
mod util;

const CHANNEL_BUFFER_SIZE: usize = 2048;

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

    let processor_connection = tokio::spawn(processor_connection::processor_connection(
        processor_url,
        tx2,
    ));

    let sse_server = tokio::spawn(server::server(tx, port));

    tokio::select! {
        _ = processor_connection => {
            error!("Processor connection thread terminated.");
            return Err(());
        }
        result = sse_server => {
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
