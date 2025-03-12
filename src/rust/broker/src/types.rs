use processor::emojicoin_dot_fun::{EmojicoinDbEventType, Period};
use serde::{Deserialize, Serialize};
use strum::{Display, EnumIter, EnumString};

#[derive(Serialize, Deserialize, Debug, EnumString, EnumIter, PartialEq, Eq, Display)]
pub enum EventType {
    Chat,
    Swap,
    Liquidity,
    State,
    GlobalState,
    PeriodicState,
    MarketRegistration,
}

#[derive(Serialize, Deserialize, Debug, Default)]
pub struct Subscription {
    #[serde(default)]
    pub markets: Vec<u64>,
    #[serde(default)]
    pub event_types: Vec<EmojicoinDbEventType>,
    #[serde(default)]
    pub arena: bool,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub arena_candlesticks: Option<Period>,
}

#[test]
fn deserialize_subscription_happy_path() {
    let json = r#"{
        "markets": [1, 2, 3],
        "event_types": [],
        "arena": true
    }"#;
    let sub: Subscription = serde_json::from_str(json).unwrap();
    assert_eq!(sub.arena_candlesticks, None);

    let json2 = r#"{
        "markets": [1, 2, 3],
        "event_types": [],
        "arena_candlesticks": "FifteenSeconds"
    }"#;
    let sub2: Subscription = serde_json::from_str(json2).unwrap();
    assert_eq!(sub2.arena_candlesticks, Some(Period::FifteenSeconds));

    let json3 = r#"{
        "markets": [1, 2, 3],
        "event_types": [],
        "arena_candlesticks": "OneHour",
        "arena": false
    }"#;
    let sub3: Subscription = serde_json::from_str(json3).unwrap();
    assert_eq!(sub3.arena_candlesticks, Some(Period::OneHour));
}

#[test]
fn subscription_idempotent_serialization_happy_path() {
    let sub = Subscription {
        markets: vec![1, 2, 3],
        event_types: vec![EmojicoinDbEventType::Chat],
        arena: true,
        arena_candlesticks: Some(Period::FifteenMinutes),
    };

    let json = serde_json::to_string(&sub).unwrap();
    let sub_parsed: Subscription = serde_json::from_str(json.as_str()).unwrap();
    assert_eq!(sub.markets, sub_parsed.markets);
    assert_eq!(sub.event_types, sub_parsed.event_types);
    assert_eq!(sub.arena, sub_parsed.arena);
    assert_eq!(sub.arena_candlesticks, sub_parsed.arena_candlesticks);
}
