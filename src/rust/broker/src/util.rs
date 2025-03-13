use std::collections::HashSet;

use log::error;
use num_traits::ToPrimitive;
use processor::emojicoin_dot_fun::{EmojicoinDbEvent, EmojicoinDbEventType};
use serde_json::Error;
use tokio::signal;

use crate::types::{ArenaPeriodRequest, ClientSubscription, SubscriptionMessage};

/// Get the market ID of a EmojicoinDbEvent of a given EventType
#[allow(dead_code)]
pub fn get_market_id(event: &EmojicoinDbEvent) -> Result<u64, String> {
    let market_id = match event {
        EmojicoinDbEvent::Swap(s) => &s.market_id,
        EmojicoinDbEvent::Chat(c) => &c.market_id,
        EmojicoinDbEvent::MarketRegistration(mr) => &mr.market_id,
        EmojicoinDbEvent::PeriodicState(ps) => &ps.market_id,
        EmojicoinDbEvent::MarketLatestState(mls) => &mls.market_id,
        EmojicoinDbEvent::Liquidity(l) => &l.market_id,
        _ => {
            return Err(
                "Trying to get market ID from event which does not have a market ID".to_string(),
            )
        }
    };

    market_id
        .to_u64()
        .ok_or("Failed to convert BigDecimal to u64".to_string())
}

/// Returns true if the given subscription should receive the given event.
#[allow(dead_code)]
pub fn is_match(subscription: &ClientSubscription, event: &EmojicoinDbEvent) -> bool {
    let event_type: EmojicoinDbEventType = event.into();
    match event_type {
        EmojicoinDbEventType::ArenaEnter
        | EmojicoinDbEventType::ArenaExit
        | EmojicoinDbEventType::ArenaMelee
        | EmojicoinDbEventType::ArenaSwap
        | EmojicoinDbEventType::ArenaVaultBalanceUpdate => subscription.arena,
        EmojicoinDbEventType::ArenaCandlestick => {
            if let EmojicoinDbEvent::ArenaCandlestick(event) = event {
                subscription
                    .arena_candlestick_periods
                    .contains(&event.period)
            } else {
                unreachable!("This would only ever be reachable if enums were mapped incorrectly.");
            }
        }
        EmojicoinDbEventType::GlobalState => {
            subscription.event_types.is_empty() || subscription.event_types.contains(&event_type)
        }
        _ => {
            let markets_is_empty = subscription.markets.is_empty();
            let event_types_is_empty = subscription.event_types.is_empty();
            if !event_types_is_empty && !subscription.event_types.contains(&event_type) {
                return false;
            }

            // At this point, event_types is either empty or it contains the event type.
            // Now just check if the market matches.
            if markets_is_empty {
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

impl From<SubscriptionMessage> for ClientSubscription {
    fn from(val: SubscriptionMessage) -> Self {
        ClientSubscription {
            arena: val.arena,
            markets: HashSet::from_iter(val.markets),
            event_types: HashSet::from_iter(val.event_types),
            arena_candlestick_periods: match val.arena_period {
                Some(period) => match period {
                    ArenaPeriodRequest::Subscribe { period } => HashSet::from([period]),
                    // Ignore whatever period they sent in; there's nothing to unsubscribe from.
                    ArenaPeriodRequest::Unsubscribe { period: _ } => HashSet::new(),
                },
                None => HashSet::new(),
            },
        }
    }
}

// Update the incoming subscription based on the text in the message received.
#[allow(dead_code)]
pub fn update_subscription(
    current_sub_opt: &mut Option<ClientSubscription>,
    msg: &str,
) -> Result<(), Error> {
    let msg = serde_json::from_str::<SubscriptionMessage>(msg)?;
    match current_sub_opt {
        // Existing subscription; insert/remove from the existing arena candlestick periods.
        Some(current_sub) => {
            if let Some(period) = msg.arena_period {
                match period {
                    ArenaPeriodRequest::Subscribe { period } => {
                        current_sub.arena_candlestick_periods.insert(period)
                    }
                    ArenaPeriodRequest::Unsubscribe { period } => {
                        current_sub.arena_candlestick_periods.remove(&period)
                    }
                };
            }
            current_sub.arena = msg.arena;
            current_sub.markets = HashSet::from_iter(msg.markets);
            current_sub.event_types = HashSet::from_iter(msg.event_types);
        }
        _ => {
            // No current subscription; just convert the message into a new subscription.
            *current_sub_opt = Some(msg.into());
        }
    };

    Ok(())
}

#[cfg(test)]
use processor::emojicoin_dot_fun::Period;

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ignore_unsubscribe_on_non_existent_sub() {
        let msg = SubscriptionMessage {
            markets: vec![1, 2, 3],
            event_types: vec![EmojicoinDbEventType::Chat],
            arena: true,
            arena_period: Some(ArenaPeriodRequest::Unsubscribe {
                period: Period::FifteenMinutes,
            }),
        };
        assert_eq!(
            ClientSubscription::from(msg),
            ClientSubscription {
                markets: HashSet::from([1, 2, 3]),
                event_types: HashSet::from([EmojicoinDbEventType::Chat]),
                arena: true,
                arena_candlestick_periods: HashSet::new(),
            }
        );
    }

    #[test]
    fn test_new_and_update_happy_path() {
        let subscription = &mut Some(ClientSubscription {
            markets: HashSet::from([1, 2, 3]),
            event_types: HashSet::from([EmojicoinDbEventType::Chat]),
            arena: true,
            arena_candlestick_periods: HashSet::from([Period::FiveMinutes]),
        });

        assert!(update_subscription(
            subscription,
            r#"{ "arena_period": { "action": "unsubscribe", "period": "FiveMinutes" } }"#,
        )
        .is_ok());

        assert_eq!(
            subscription.take().unwrap(),
            ClientSubscription {
                markets: HashSet::new(),
                event_types: HashSet::new(),
                arena: false,
                arena_candlestick_periods: HashSet::new(),
            }
        );

        assert!(update_subscription(
            subscription,
            r#"{ "arena_period": { "action": "subscribe", "period": "FifteenMinutes" } }"#,
        )
        .is_ok());

        assert!(update_subscription(
            subscription,
            r#"{
               "markets": [4, 2, 13, 14, 14, 14, 14, 14],
               "event_types": ["MarketRegistration"],
               "arena": false,
               "arena_period": { "action": "subscribe", "period": "OneHour" }
            }"#,
        )
        .is_ok());

        assert_eq!(
            subscription.take().unwrap(),
            ClientSubscription {
                markets: HashSet::from([4, 2, 13, 14]),
                event_types: HashSet::from([EmojicoinDbEventType::MarketRegistration]),
                arena: false,
                arena_candlestick_periods: HashSet::from([Period::FifteenMinutes, Period::OneHour]),
            }
        );
    }
}
