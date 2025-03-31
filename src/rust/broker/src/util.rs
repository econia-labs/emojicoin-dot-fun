use std::collections::HashSet;

use log::error;
use num_traits::ToPrimitive;
use processor::emojicoin_dot_fun::{EmojicoinDbEvent, EmojicoinDbEventType};
use serde_json::Error;
use tokio::signal;

use crate::types::{
    ArenaPeriodRequest, ClientSubscription, MarketPeriodRequest, SubscriptionMessage,
};

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
        EmojicoinDbEvent::Candlestick(candle) => &candle.market_id,
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
        EmojicoinDbEventType::Candlestick => {
            if let EmojicoinDbEvent::Candlestick(event) = &event {
                subscription.market_candlestick_periods.contains(&(
                    event
                        .market_id
                        .to_u64()
                        .expect("market_id should be a u64."),
                    event.period,
                ))
            } else {
                unreachable!("This would only ever be reachable if enums were mapped incorrectly.");
            }
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
            market_candlestick_periods: match val.market_period {
                Some(mp_request) => match mp_request {
                    MarketPeriodRequest::Subscribe { market_id, period } => {
                        HashSet::from([(market_id, period)])
                    }
                    // Ignore whatever period they sent in; there's nothing to unsubscribe from.
                    MarketPeriodRequest::Unsubscribe {
                        market_id: _,
                        period: _,
                    } => HashSet::new(),
                },
                None => HashSet::new(),
            },
            arena_candlestick_periods: match val.arena_period {
                Some(ap_request) => match ap_request {
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
            if let Some(ap_request) = msg.arena_period {
                match ap_request {
                    ArenaPeriodRequest::Subscribe { period } => {
                        current_sub.arena_candlestick_periods.insert(period);
                    }
                    ArenaPeriodRequest::Unsubscribe { period } => {
                        current_sub.arena_candlestick_periods.remove(&period);
                    }
                };
            }
            if let Some(mp_request) = msg.market_period {
                match mp_request {
                    MarketPeriodRequest::Subscribe { market_id, period } => {
                        current_sub
                            .market_candlestick_periods
                            .insert((market_id, period));
                    }
                    MarketPeriodRequest::Unsubscribe { market_id, period } => {
                        current_sub
                            .market_candlestick_periods
                            .remove(&(market_id, period));
                    }
                }
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
mod tests {
    use super::*;
    use processor::emojicoin_dot_fun::Period;

    #[test]
    fn test_ignore_unsubscribe_on_non_existent_sub() {
        let msg = SubscriptionMessage {
            markets: vec![1, 2, 3],
            event_types: vec![EmojicoinDbEventType::Chat],
            market_period: Some(MarketPeriodRequest::Subscribe {
                market_id: 12,
                period: Period::FifteenMinutes,
            }),
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
                market_candlestick_periods: HashSet::from([(12, Period::FifteenMinutes)]),
                arena: true,
                arena_candlestick_periods: HashSet::new(),
            }
        );
    }

    #[test]
    fn test_new_and_update_happy_path() {
        let market_periods_original_sub = HashSet::from([(3, Period::FiveMinutes)]);
        let subscription = &mut Some(ClientSubscription {
            markets: HashSet::from([1, 2, 3]),
            event_types: HashSet::from([EmojicoinDbEventType::Chat]),
            market_candlestick_periods: market_periods_original_sub.clone(),
            arena: true,
            arena_candlestick_periods: HashSet::from([Period::FiveMinutes]),
        });

        assert!(update_subscription(
            subscription,
            r#"{ "arena_period": { "action": "unsubscribe", "period": "FiveMinutes" } }"#,
        )
        .is_ok());

        assert_eq!(
            *subscription.as_ref().unwrap(),
            ClientSubscription {
                markets: HashSet::new(),
                event_types: HashSet::new(),
                market_candlestick_periods: market_periods_original_sub.clone(),
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
            *subscription.as_ref().unwrap(),
            ClientSubscription {
                markets: HashSet::from([4, 2, 13, 14]),
                event_types: HashSet::from([EmojicoinDbEventType::MarketRegistration]),
                market_candlestick_periods: market_periods_original_sub,
                arena: false,
                arena_candlestick_periods: HashSet::from([Period::FifteenMinutes, Period::OneHour]),
            }
        );
    }

    #[test]
    fn test_one_market_subscription() {
        let subscription = &mut Some(ClientSubscription {
            markets: HashSet::new(),
            event_types: HashSet::new(),
            market_candlestick_periods: HashSet::new(),
            arena: false,
            arena_candlestick_periods: HashSet::new(),
        });
        assert!(update_subscription(
            subscription,
            r#"{ "market_period": { "action": "subscribe", "market_id": 33, "period": "OneHour" } }"#,
        ).is_ok());
        assert_eq!(
            *subscription.as_mut().unwrap(),
            ClientSubscription {
                markets: HashSet::new(),
                event_types: HashSet::new(),
                market_candlestick_periods: HashSet::from([(33, Period::OneHour)]),
                arena: false,
                arena_candlestick_periods: HashSet::new(),
            }
        );
    }

    #[test]
    fn test_market_subscriptions_happy_path() {
        let subscription = &mut Some(ClientSubscription {
            markets: HashSet::from([1, 2, 3]),
            event_types: HashSet::from([EmojicoinDbEventType::Chat]),
            market_candlestick_periods: HashSet::from([(1234, Period::FiveMinutes)]),
            arena: true,
            arena_candlestick_periods: HashSet::from([Period::FiveMinutes]),
        });

        vec![
            // -  Start            =>  (1234, 5m)
            // a. Add (77, 1m)     =>  (1234, 5m), (77, 1m)
            // b. Add (123, 1m)    =>  (1234, 5m), (77, 1m), (123, 1m)
            // c. Remove (1, 1m)   =>  (1234, 5m), (77, 1m), (123, 1m)
            // d. Add (1, 1m)      =>  (1234, 5m), (77, 1m), (123, 1m), (1, 1m)
            // e. Add (2, 4h)      =>  (1234, 5m), (77, 1m), (123, 1m), (1, 1m), (2, 4h)
            // f. Remove (1, 1m)   =>  (1234, 5m), (77, 1m), (123, 1m), (2, 4h)
            // g. Add (77, 5m)     =>  (1234, 5m), (77, 1m), (123, 1m), (2, 4h), (77, 5m)
            // h. Add (77, 15m)    =>  (1234, 5m), (77, 1m), (123, 1m), (2, 4h), (77, 5m), (77, 15m)
            // i. Remove (123, 1m) =>  (1234, 5m), (77, 1m), (2, 4h), (77, 5m), (77, 15m)
            // j. Remove (77, 5m)  =>  (1234, 5m), (77, 1m), (2, 4h), (77, 15m)
            // k. Add (1923, 15s)  =>  (1234, 5m), (77, 1m), (2, 4h), (77, 15m), (1923, 15s)
            // -------------------------------------------------------------------------------------
            r#"{ "market_period": { "action": "subscribe", "market_id": 77, "period": "OneMinute" } }"#, // a.
            r#"{ "market_period": { "action": "subscribe", "market_id": 123, "period": "OneMinute" } }"#, // b.
            r#"{ "market_period": { "action": "unsubscribe", "market_id": 1, "period": "OneMinute" } }"#, // c.
            r#"{ "market_period": { "action": "subscribe", "market_id": 1, "period": "OneMinute" } }"#, // d.
            r#"{ "market_period": { "action": "subscribe", "market_id": 2, "period": "FourHours" } }"#, // e.
            r#"{ "market_period": { "action": "unsubscribe", "market_id": 1, "period": "OneMinute" } }"#, // f.
            r#"{ "market_period": { "action": "subscribe", "market_id": 77, "period": "FiveMinutes" } }"#, // g.
            r#"{ "market_period": { "action": "subscribe", "market_id": 77, "period": "FifteenMinutes" } }"#, // h.
            r#"{ "market_period": { "action": "unsubscribe", "market_id": 123, "period": "OneMinute" } }"#, // i.
            r#"{ "market_period": { "action": "unsubscribe", "market_id": 77, "period": "FiveMinutes" } }"#, // j.
            r#"{ "market_period": { "action": "subscribe", "market_id": 1923, "period": "FifteenSeconds" } }"#, // k.
        ]
        .into_iter()
        .for_each(|msg| {
            // Check each sub in the interim is correctly added or removed.
            let market_period_request = serde_json::from_str::<SubscriptionMessage>(msg)
                .map(|sub| sub.market_period)
                .ok()
                .flatten()
                .unwrap();
            assert!(update_subscription(subscription, msg).is_ok());
            assert!(subscription.as_ref().is_some_and(|inner_sub| {
                match market_period_request {
                    MarketPeriodRequest::Subscribe { market_id, period } => inner_sub
                        .market_candlestick_periods
                        .contains(&(market_id, period)),
                    MarketPeriodRequest::Unsubscribe { market_id, period } => !inner_sub
                        .market_candlestick_periods
                        .contains(&(market_id, period)),
                }
            }));
        });

        // Check the final result.
        assert!(subscription.is_some());
        assert_eq!(
            *subscription.as_ref().unwrap(),
            // Keep in mind it *always* overwrites `markets`, `event_types`, and `arena` with the
            // last message value, which uses defaults if nothing is there.
            ClientSubscription {
                markets: HashSet::new(),
                event_types: HashSet::new(),
                market_candlestick_periods: HashSet::from([
                    (1234, Period::FiveMinutes),
                    (77, Period::OneMinute),
                    (2, Period::FourHours),
                    (77, Period::FifteenMinutes),
                    (1923, Period::FifteenSeconds)
                ]),
                arena: false,
                arena_candlestick_periods: subscription
                    .as_ref()
                    .unwrap()
                    .arena_candlestick_periods
                    .clone(),
            }
        );
    }
}
