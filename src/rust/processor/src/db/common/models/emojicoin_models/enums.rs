use super::{
    constants::{
        ARENA_ENTER_EVENT, ARENA_EXIT_EVENT, ARENA_MELEE_EVENT, ARENA_SWAP_EVENT,
        ARENA_VAULT_BALANCE_UPDATE_EVENT, CHAT_EVENT, GLOBAL_STATE_EVENT, LIQUIDITY_EVENT,
        MARKET_REGISTRATION_EVENT, MARKET_RESOURCE, PERIODIC_STATE_EVENT, STATE_EVENT, SWAP_EVENT,
    },
    json_types::{ArenaEvent, EventWithMarket, GlobalStateEvent},
    models::prelude::*,
};
use chrono::TimeDelta;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

#[derive(
    Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, diesel_derive_enum::DbEnum,
)]
#[ExistingTypePath = "crate::schema::sql_types::TriggerType"]
pub enum Trigger {
    PackagePublication,
    MarketRegistration,
    SwapBuy,
    SwapSell,
    ProvideLiquidity,
    RemoveLiquidity,
    Chat,
}

impl Trigger {
    pub fn from_i16(i: i16) -> Option<Self> {
        match i {
            0 => Some(Self::PackagePublication),
            1 => Some(Self::MarketRegistration),
            2 => Some(Self::SwapBuy),
            3 => Some(Self::SwapSell),
            4 => Some(Self::ProvideLiquidity),
            5 => Some(Self::RemoveLiquidity),
            6 => Some(Self::Chat),
            _ => None,
        }
    }
}

impl From<&Trigger> for i16 {
    fn from(i: &Trigger) -> Self {
        match i {
            Trigger::PackagePublication => 0,
            Trigger::MarketRegistration => 1,
            Trigger::SwapBuy => 2,
            Trigger::SwapSell => 3,
            Trigger::ProvideLiquidity => 4,
            Trigger::RemoveLiquidity => 5,
            Trigger::Chat => 6,
        }
    }
}

pub fn serialize_state_trigger<S>(element: &Trigger, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_i16(element.into())
}

pub fn deserialize_state_trigger<'de, D>(deserializer: D) -> core::result::Result<Trigger, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Error;
    let trigger = <i16>::deserialize(deserializer)?;
    match Trigger::from_i16(trigger) {
        Some(trigger) => Ok(trigger),
        None => Err(D::Error::custom(format!(
            "Failed to deserialize Trigger from i16: {}",
            trigger
        ))),
    }
}

#[derive(
    Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize, diesel_derive_enum::DbEnum,
)]
#[ExistingTypePath = "crate::schema::sql_types::PeriodType"]
pub enum Period {
    #[db_rename = "period_15s"]
    FifteenSeconds,
    #[db_rename = "period_1m"]
    OneMinute,
    #[db_rename = "period_5m"]
    FiveMinutes,
    #[db_rename = "period_15m"]
    FifteenMinutes,
    #[db_rename = "period_30m"]
    ThirtyMinutes,
    #[db_rename = "period_1h"]
    OneHour,
    #[db_rename = "period_4h"]
    FourHours,
    #[db_rename = "period_1d"]
    OneDay,
}

pub fn serialize_state_period<S>(element: &Period, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let r = match element {
        Period::FifteenSeconds => "15000000",
        Period::OneMinute => "60000000",
        Period::FiveMinutes => "300000000",
        Period::FifteenMinutes => "900000000",
        Period::ThirtyMinutes => "1800000000",
        Period::OneHour => "3600000000",
        Period::FourHours => "14400000000",
        Period::OneDay => "86400000000",
    };
    s.serialize_str(r)
}

pub fn deserialize_state_period<'de, D>(deserializer: D) -> core::result::Result<Period, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Error;
    let period = <String>::deserialize(deserializer)?;
    match period.as_str() {
        "15000000" => Ok(Period::FifteenSeconds),
        "60000000" => Ok(Period::OneMinute),
        "300000000" => Ok(Period::FiveMinutes),
        "900000000" => Ok(Period::FifteenMinutes),
        "1800000000" => Ok(Period::ThirtyMinutes),
        "3600000000" => Ok(Period::OneHour),
        "14400000000" => Ok(Period::FourHours),
        "86400000000" => Ok(Period::OneDay),
        _ => Err(D::Error::custom(format!(
            "Failed to deserialize PeriodType from string: {}",
            period
        ))),
    }
}

impl Period {
    pub fn to_time_delta(self) -> TimeDelta {
        match self {
            Period::FifteenSeconds => TimeDelta::try_seconds(15).unwrap(),
            Period::OneMinute => TimeDelta::try_minutes(1).unwrap(),
            Period::FiveMinutes => TimeDelta::try_minutes(5).unwrap(),
            Period::FifteenMinutes => TimeDelta::try_minutes(15).unwrap(),
            Period::ThirtyMinutes => TimeDelta::try_minutes(30).unwrap(),
            Period::OneHour => TimeDelta::try_hours(1).unwrap(),
            Period::FourHours => TimeDelta::try_hours(4).unwrap(),
            Period::OneDay => TimeDelta::try_days(1).unwrap(),
        }
    }
}

pub enum EmojicoinTypeTag {
    Swap,
    Chat,
    MarketRegistration,
    PeriodicState,
    State,
    GlobalState,
    Liquidity,
    Market,
    ArenaMelee,
    ArenaEnter,
    ArenaExit,
    ArenaSwap,
    ArenaVaultBalanceUpdate,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum EmojicoinEvent {
    EventWithMarket(EventWithMarket),
    EventWithoutMarket(GlobalStateEvent),
    ArenaEvent(ArenaEvent),
}

#[derive(Serialize, Deserialize, Debug, Clone, strum::Display)]
pub enum EmojicoinDbEvent {
    Swap(SwapEventModel),
    Chat(ChatEventModel),
    MarketRegistration(MarketRegistrationEventModel),
    PeriodicState(PeriodicStateEventModel),
    MarketLatestState(MarketLatestStateEventModel),
    GlobalState(GlobalStateEventModel),
    Liquidity(LiquidityEventModel),
    ArenaMelee(ArenaMeleeEventModel),
    ArenaEnter(ArenaEnterEventModel),
    ArenaExit(ArenaExitEventModel),
    ArenaSwap(ArenaSwapEventModel),
    ArenaVaultBalanceUpdate(ArenaVaultBalanceUpdateEventModel),
    // Not an actual event in the contract- but is sent to the broker.
    ArenaCandlestick(ArenaCandlestickModel),
    Candlestick(CandlestickModel),
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq)]
pub enum EmojicoinEventType {
    Swap,
    Chat,
    MarketRegistration,
    PeriodicState,
    State,
    GlobalState,
    Liquidity,
    ArenaMelee,
    ArenaEnter,
    ArenaExit,
    ArenaSwap,
    ArenaVaultBalanceUpdate,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, Eq, Hash)]
pub enum EmojicoinDbEventType {
    Swap,
    Chat,
    MarketRegistration,
    PeriodicState,
    MarketLatestState,
    GlobalState,
    Liquidity,
    ArenaMelee,
    ArenaEnter,
    ArenaExit,
    ArenaSwap,
    ArenaVaultBalanceUpdate,
    // Not an actual event in the contract- but is sent to the broker.
    ArenaCandlestick,
    Candlestick,
}

impl From<&EmojicoinEvent> for EmojicoinEventType {
    fn from(value: &EmojicoinEvent) -> Self {
        match value {
            EmojicoinEvent::EventWithMarket(e) => match e {
                EventWithMarket::PeriodicState(_) => EmojicoinEventType::PeriodicState,
                EventWithMarket::State(_) => EmojicoinEventType::State,
                EventWithMarket::Swap(_) => EmojicoinEventType::Swap,
                EventWithMarket::Chat(_) => EmojicoinEventType::Chat,
                EventWithMarket::Liquidity(_) => EmojicoinEventType::Liquidity,
                EventWithMarket::MarketRegistration(_) => EmojicoinEventType::MarketRegistration,
            },
            EmojicoinEvent::ArenaEvent(e) => match e {
                ArenaEvent::Melee(_) => EmojicoinEventType::ArenaMelee,
                ArenaEvent::Enter(_) => EmojicoinEventType::ArenaEnter,
                ArenaEvent::Exit(_) => EmojicoinEventType::ArenaExit,
                ArenaEvent::Swap(_) => EmojicoinEventType::ArenaSwap,
                ArenaEvent::VaultBalanceUpdate(_) => EmojicoinEventType::ArenaVaultBalanceUpdate,
            },
            EmojicoinEvent::EventWithoutMarket(_) => EmojicoinEventType::GlobalState,
        }
    }
}

impl From<&EmojicoinDbEvent> for EmojicoinDbEventType {
    fn from(value: &EmojicoinDbEvent) -> Self {
        match value {
            EmojicoinDbEvent::Swap(_) => Self::Swap,
            EmojicoinDbEvent::Chat(_) => Self::Chat,
            EmojicoinDbEvent::MarketRegistration(_) => Self::MarketRegistration,
            EmojicoinDbEvent::PeriodicState(_) => Self::PeriodicState,
            EmojicoinDbEvent::MarketLatestState(_) => Self::MarketLatestState,
            EmojicoinDbEvent::GlobalState(_) => Self::GlobalState,
            EmojicoinDbEvent::Liquidity(_) => Self::Liquidity,
            EmojicoinDbEvent::ArenaMelee(_) => Self::ArenaMelee,
            EmojicoinDbEvent::ArenaEnter(_) => Self::ArenaEnter,
            EmojicoinDbEvent::ArenaExit(_) => Self::ArenaExit,
            EmojicoinDbEvent::ArenaSwap(_) => Self::ArenaSwap,
            EmojicoinDbEvent::ArenaVaultBalanceUpdate(_) => Self::ArenaVaultBalanceUpdate,
            EmojicoinDbEvent::ArenaCandlestick(_) => Self::ArenaCandlestick,
            EmojicoinDbEvent::Candlestick(_) => Self::Candlestick,
        }
    }
}

impl EmojicoinTypeTag {
    pub fn from_type_str(type_str: &str) -> Option<Self> {
        match type_str {
            str if str == SWAP_EVENT.as_str() => Some(Self::Swap),
            str if str == CHAT_EVENT.as_str() => Some(Self::Chat),
            str if str == MARKET_REGISTRATION_EVENT.as_str() => Some(Self::MarketRegistration),
            str if str == PERIODIC_STATE_EVENT.as_str() => Some(Self::PeriodicState),
            str if str == STATE_EVENT.as_str() => Some(Self::State),
            str if str == GLOBAL_STATE_EVENT.as_str() => Some(Self::GlobalState),
            str if str == LIQUIDITY_EVENT.as_str() => Some(Self::Liquidity),
            str if str == MARKET_RESOURCE.as_str() => Some(Self::Market),
            str if ARENA_MELEE_EVENT.as_ref().is_some_and(|s| s == str) => Some(Self::ArenaMelee),
            str if ARENA_ENTER_EVENT.as_ref().is_some_and(|s| s == str) => Some(Self::ArenaEnter),
            str if ARENA_EXIT_EVENT.as_ref().is_some_and(|s| s == str) => Some(Self::ArenaExit),
            str if ARENA_SWAP_EVENT.as_ref().is_some_and(|s| s == str) => Some(Self::ArenaSwap),
            str if ARENA_VAULT_BALANCE_UPDATE_EVENT
                .as_ref()
                .is_some_and(|s| s == str) =>
            {
                Some(Self::ArenaVaultBalanceUpdate)
            }
            _ => None,
        }
    }
}

impl EmojicoinDbEvent {
    pub fn from_market_registration_events(events: &[MarketRegistrationEventModel]) -> Vec<Self> {
        events
            .iter()
            .cloned()
            .map(Self::MarketRegistration)
            .collect()
    }

    pub fn from_swap_events(events: &[SwapEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::Swap).collect()
    }

    pub fn from_chat_events(events: &[ChatEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::Chat).collect()
    }

    pub fn from_liquidity_events(events: &[LiquidityEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::Liquidity).collect()
    }

    pub fn from_periodic_state_events(events: &[PeriodicStateEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::PeriodicState).collect()
    }

    pub fn from_global_state_events(events: &[GlobalStateEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::GlobalState).collect()
    }

    pub fn from_market_latest_state_events(events: &[MarketLatestStateEventModel]) -> Vec<Self> {
        events
            .iter()
            .cloned()
            .map(Self::MarketLatestState)
            .collect()
    }

    pub fn from_arena_melee(events: &[ArenaMeleeEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::ArenaMelee).collect()
    }

    pub fn from_arena_enter(events: &[ArenaEnterEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::ArenaEnter).collect()
    }

    pub fn from_arena_exit(events: &[ArenaExitEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::ArenaExit).collect()
    }

    pub fn from_arena_swap(events: &[ArenaSwapEventModel]) -> Vec<Self> {
        events.iter().cloned().map(Self::ArenaSwap).collect()
    }

    pub fn from_arena_vault_balance_update(
        events: &[ArenaVaultBalanceUpdateEventModel],
    ) -> Vec<Self> {
        events
            .iter()
            .cloned()
            .map(Self::ArenaVaultBalanceUpdate)
            .collect()
    }

    pub fn from_arena_candlesticks(candlesticks: &[ArenaCandlestickModel]) -> Vec<Self> {
        candlesticks
            .iter()
            .cloned()
            .map(Self::ArenaCandlestick)
            .collect()
    }

    pub fn from_candlesticks(candlesticks: &[CandlestickModel]) -> Vec<Self> {
        candlesticks
            .iter()
            .cloned()
            .map(Self::Candlestick)
            .collect()
    }
}
