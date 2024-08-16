use processor::emojicoin_dot_fun::EmojicoinEventType;
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
    pub event_types: Vec<EmojicoinEventType>,
}
