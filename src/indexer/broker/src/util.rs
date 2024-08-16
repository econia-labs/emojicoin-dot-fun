use processor::emojicoin_dot_fun::{EmojicoinEvent, EmojicoinEventType};
use tokio::signal;

use crate::types::Subscription;

/// Get the market ID of a EmojicoinEvent of a given EventType
pub fn get_market_id(event: &EmojicoinEvent) -> Result<u64, String> {
    match event {
        EmojicoinEvent::EventWithMarket(e) => {
            let market_id = e.get_market_id().try_into();
            if let Ok(market_id) = market_id {
                Ok(market_id)
            } else {
                Err("Got negative market ID".to_string())
            }
        },
        _ => Err("Got event which does not have a market ID".to_string())
    }
}

/// Returns true if the given subscription should receive the given event.
pub fn is_match(subscription: &Subscription, event: &EmojicoinEvent) -> bool {
    // If all fields of a subscription are empty, all events should be sent there.
    if subscription.markets.is_empty() && subscription.event_types.is_empty() {
        return true;
    }

    let event_type: EmojicoinEventType = event.into();

    if !subscription.event_types.is_empty() && !subscription.event_types.contains(&event_type) {
        return false;
    }
    if subscription.markets.is_empty() {
        return true;
    }
    if event_type == EmojicoinEventType::GlobalState {
        return true;
    }

    match get_market_id(event) {
        Ok(market_id) => subscription.markets.contains(&market_id),
        Err(msg) => {
            log::error!("{msg}");
            false
        }
    }
}

pub async fn shutdown_signal() -> Result<(), String> {
    #[cfg(unix)]
    let terminate_signal = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .map_err(|error| error.to_string())?
            .recv()
            .await;
        Ok(())
    };

    #[cfg(not(unix))]
    let terminate_signal = std::future::pending();

    tokio::select! {
        result = signal::ctrl_c() => {
            result.map_err(|error| error.to_string())?;
            Ok(())
        },
        result = terminate_signal => { result }
    }
}
