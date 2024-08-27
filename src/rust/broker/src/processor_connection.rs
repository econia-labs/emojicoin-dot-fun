use std::{
    sync::Arc,
    time::{Duration, SystemTime},
};

use futures_util::StreamExt;
use log::{error, info, log_enabled, warn, Level};
use processor::emojicoin_dot_fun::EmojicoinDbEvent;
use tokio::sync::{broadcast::Sender, RwLock};
use tokio_tungstenite::connect_async;

use crate::{BrokerHealth, HealthStatus};

/// Number of retries before giving up and exiting.
const CONNECTION_RETRIES: u64 = 10;

/// Amount of seconds after which a connection is considered successful.
///
/// If a connection lasts at least this amount, and the connection did not return
/// [`ConnectionError::ConnectionImpossible`], the number of retries will be reset to 0.
const RETRY_TRESHOLD: Duration = Duration::from_secs(10);

/// Number of seconds to wait before reconnecting on the first retry.
const INSTANT_RECONNECTION_TIMEOUT: Duration = Duration::from_secs(1);

/// Number of seconds to wait before reconnecting on all but the first retry.
const DELAYED_RECONNECTION_TIMEOUT: Duration = Duration::from_secs(15);

enum ConnectionError {
    /// Could not connect to the processor at all.
    ConnectionImpossible,
    /// Connection to the processor established but lost.
    ConnectionLost,
}

pub async fn start(
    processor_url: String,
    tx: Sender<EmojicoinDbEvent>,
    broker_health: Arc<RwLock<BrokerHealth>>,
) {
    // Number of retries since last successful connection.
    let mut retries = 0;

    // Is this the first iteration of the loop.
    let mut first_time = true;

    loop {
        // Timestamp of the start of the connection.
        let start_timestamp = SystemTime::now();
        let res =
            processor_connection(processor_url.clone(), tx.clone(), broker_health.clone()).await;
        let connection_duration = SystemTime::elapsed(&start_timestamp).unwrap();

        // In the broker connected to the processor and the connection duration was longer than the
        // retry treshold, it is considered successful.
        let connection_successful = matches!(res, Err(ConnectionError::ConnectionLost))
            && connection_duration > RETRY_TRESHOLD;

        if connection_successful {
            retries = 0;
        }

        // If this is the first connection and it was unsuccsessful, do not try to retry.
        if first_time && !connection_successful {
            break;
        }

        first_time = false;

        if retries == 0 {
            // If this is the first retry, try and reconnect instantly.
            warn!("Trying to reconnect to the processor. (retries left: {CONNECTION_RETRIES}).");
            tokio::time::sleep(INSTANT_RECONNECTION_TIMEOUT).await;
        } else if retries < CONNECTION_RETRIES {
            warn!(
                "Waiting {DELAYED_RECONNECTION_TIMEOUT:?} then retrying (retries left: {}).",
                CONNECTION_RETRIES - retries
            );
            tokio::time::sleep(DELAYED_RECONNECTION_TIMEOUT).await;
        } else {
            error!("No retries left.");
            break;
        }
        retries = retries + 1;
    }
}

async fn processor_connection(
    processor_url: String,
    tx: Sender<EmojicoinDbEvent>,
    broker_health: Arc<RwLock<BrokerHealth>>,
) -> Result<(), ConnectionError> {
    let connection = connect_async(processor_url).await;
    let mut connection = if let Ok(connection) = connection {
        connection
    } else {
        broker_health.write().await.processor_connection = HealthStatus::Dead;
        error!("Could not connect to the processor.");
        return Err(ConnectionError::ConnectionImpossible);
    };
    broker_health.write().await.processor_connection = HealthStatus::Ok;
    info!("Connected to the processor.");
    let mut is_sick = false;
    while let Some(msg) = connection.0.next().await {
        if msg.is_err() {
            broker_health.write().await.processor_connection = HealthStatus::Sick;
            is_sick = true;
            error!("Got an error instead of a message: {}", msg.unwrap_err());
            continue;
        }
        let msg = msg.unwrap();
        let msg = msg.to_text();
        if msg.is_err() {
            broker_health.write().await.processor_connection = HealthStatus::Sick;
            is_sick = true;
            error!("Could not convert message to text: {}", msg.unwrap_err());
            continue;
        }
        let msg = msg.unwrap();
        let res: Result<EmojicoinDbEvent, _> = serde_json::de::from_str(msg);
        if res.is_err() {
            broker_health.write().await.processor_connection = HealthStatus::Sick;
            is_sick = true;
            error!(
                "Could not parse message: error: {}, message: {}",
                res.unwrap_err(),
                msg
            );
            continue;
        }
        let msg = res.unwrap();
        if is_sick {
            broker_health.write().await.processor_connection = HealthStatus::Ok;
        }
        if log_enabled!(Level::Debug) {
            info!("Got message from processor: {msg:?}.");
        } else {
            info!("Got message from processor: {msg}.");
        }
        let _ = tx.send(msg);
    }
    info!("Connection to the processor terminated.");
    broker_health.write().await.processor_connection = HealthStatus::Dead;
    Err(ConnectionError::ConnectionLost)
}
