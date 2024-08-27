use log::error;
use processor::emojicoin_dot_fun::{EmojicoinDbEvent, EmojicoinDbEventType};
use tokio::signal;

use crate::types::Subscription;

/// Get the market ID of a EmojicoinDbEvent of a given EventType
pub fn get_market_id(event: &EmojicoinDbEvent) -> Result<u64, String> {
    let market_id: Result<u64, _> = match event {
        EmojicoinDbEvent::Swap(s) => s.market_id,
        EmojicoinDbEvent::Chat(c) => c.market_id,
        EmojicoinDbEvent::MarketRegistration(mr) => mr.market_id,
        EmojicoinDbEvent::PeriodicState(ps) => ps.market_id,
        EmojicoinDbEvent::MarketLatestState(mls) => mls.market_id,
        EmojicoinDbEvent::Liquidity(l) => l.market_id,
        _ => {
            return Err(
                "Trying to get market ID from event which does not have a market ID".to_string(),
            )
        }
    }
    .try_into();
    if let Ok(market_id) = market_id {
        Ok(market_id)
    } else {
        Err("Got negative market ID".to_string())
    }
}

/// Returns true if the given subscription should receive the given event.
pub fn is_match(subscription: &Subscription, event: &EmojicoinDbEvent) -> bool {
    // If all fields of a subscription are empty, all events should be sent there.
    if subscription.markets.is_empty() && subscription.event_types.is_empty() {
        return true;
    }

    let event_type: EmojicoinDbEventType = event.into();

    if !subscription.event_types.is_empty() && !subscription.event_types.contains(&event_type) {
        return false;
    }
    if subscription.markets.is_empty() {
        return true;
    }
    if event_type == EmojicoinDbEventType::GlobalState {
        return true;
    }

    match get_market_id(event) {
        Ok(market_id) => subscription.markets.contains(&market_id),
        Err(msg) => {
            error!("{msg}");
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
