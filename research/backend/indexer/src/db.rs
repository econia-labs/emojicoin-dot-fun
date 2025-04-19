use chrono::TimeDelta;
use serde::{Deserialize, Serialize};

#[derive(sqlx::Type, Serialize, Deserialize, Debug, PartialEq, Eq)]
#[sqlx(type_name = "event_type", rename_all = "snake_case")]
pub enum EventType {
    GlobalState,
    State,
    PeriodicState,
    MarketRegistration,
    Swap,
    Chat,
    Liquidity,
    Melee,
    ArenaEnter,
    ArenaSwap,
    ArenaExit,
    ArenaVaultBalanceUpdate,
    Favorite,
}

#[derive(sqlx::Type, Serialize, Deserialize, Debug, Hash, PartialEq, Eq, Clone, Copy)]
#[sqlx(type_name = "candlestick_duration", rename_all = "snake_case")]
pub enum CandlestickDuration {
    FifteenSeconds,
    OneMinute,
    FiveMinutes,
    FifteenMinutes,
    ThirtyMinutes,
    OneHour,
    FourHours,
    OneDay,
}

impl CandlestickDuration {
    pub fn all() -> Vec<CandlestickDuration> {
        vec![
            CandlestickDuration::FifteenSeconds,
            CandlestickDuration::OneMinute,
            CandlestickDuration::FiveMinutes,
            CandlestickDuration::FifteenMinutes,
            CandlestickDuration::ThirtyMinutes,
            CandlestickDuration::OneHour,
            CandlestickDuration::FourHours,
            CandlestickDuration::OneDay,
        ]
    }

    pub fn time_delta(&self) -> TimeDelta {
        match self {
            CandlestickDuration::FifteenSeconds => TimeDelta::seconds(15),
            CandlestickDuration::OneMinute => TimeDelta::minutes(1),
            CandlestickDuration::FiveMinutes => TimeDelta::minutes(5),
            CandlestickDuration::FifteenMinutes => TimeDelta::minutes(15),
            CandlestickDuration::ThirtyMinutes => TimeDelta::minutes(30),
            CandlestickDuration::OneHour => TimeDelta::hours(1),
            CandlestickDuration::FourHours => TimeDelta::hours(4),
            CandlestickDuration::OneDay => TimeDelta::days(1),
        }
    }
}
