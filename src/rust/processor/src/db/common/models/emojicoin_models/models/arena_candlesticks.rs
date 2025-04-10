use crate::{
    db::common::models::emojicoin_models::{
        constants::{ARENA_CANDLESTICK_PERIODS, CANDLESTICK_DECIMALS},
        enums::Period,
        json_types::{StateEvent, TxnInfo},
    },
    schema::arena_candlesticks,
};
use bigdecimal::{BigDecimal, RoundingMode};
use chrono::{DurationRound, NaiveDateTime};
use field_count::FieldCount;
use num::FromPrimitive;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone)]
pub struct ArenaCandlestickDiffModelBuilder {
    pub melee_id: BigDecimal,
    pub last_transaction_version: i64,

    pub period: Period,
    pub start_time: NaiveDateTime,

    pub open_price: BigDecimal,
    pub high_price: BigDecimal,
    pub low_price: BigDecimal,
    pub close_price: BigDecimal,

    pub open_timestamp: (i64, i64),
    pub close_timestamp: (i64, i64),

    pub volume: BigDecimal,
    pub n_swaps: BigDecimal,
}

impl ArenaCandlestickDiffModelBuilder {
    pub fn merge(sticks: Vec<Self>) -> Vec<Self> {
        let mut sticks_map: HashMap<(BigDecimal, Period, NaiveDateTime), Self> = HashMap::new();

        for stick in sticks {
            let stick_clone = stick.clone();
            sticks_map
                .entry((stick.melee_id.clone(), stick.period, stick.start_time))
                .and_modify(|s| {
                    s.last_transaction_version =
                        std::cmp::max(s.last_transaction_version, stick.last_transaction_version);
                    s.volume += stick.volume;
                    s.n_swaps += stick.n_swaps;
                    s.high_price = BigDecimal::max(s.high_price.clone(), stick.high_price);
                    s.low_price = BigDecimal::min(s.low_price.clone(), stick.low_price);
                    if s.open_timestamp > stick.open_timestamp {
                        s.open_price = stick.open_price;
                        s.open_timestamp = stick.open_timestamp;
                    }
                    if s.close_timestamp < stick.close_timestamp {
                        s.close_price = stick.close_price;
                        s.close_timestamp = stick.close_timestamp;
                    }
                })
                .or_insert(stick_clone);
        }

        sticks_map.into_values().collect()
    }

    pub fn from_state_event(
        txn_info: &TxnInfo,
        melee_id: BigDecimal,
        state: StateEvent,
        swap_timestamp: (i64, i64),
        price_0: BigDecimal,
        price_1: BigDecimal,
    ) -> Vec<Self> {
        let mut candlesticks: Vec<Self> = vec![];

        for &period in ARENA_CANDLESTICK_PERIODS.iter() {
            let start_time = txn_info
                .timestamp
                .duration_trunc(period.to_time_delta())
                .unwrap();
            let price = price_0.clone() / price_1.clone();
            let x = Self {
                melee_id: melee_id.clone(),
                last_transaction_version: txn_info.version,
                period,
                start_time,
                open_price: price.clone(),
                high_price: price.clone(),
                low_price: price.clone(),
                close_price: price,
                close_timestamp: swap_timestamp,
                open_timestamp: swap_timestamp,
                volume: state.last_swap.quote_volume.clone(),
                n_swaps: BigDecimal::from_u8(1).unwrap(),
            };
            candlesticks.push(x);
        }
        candlesticks
    }
}
#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(melee_id, period, start_time))]
#[diesel(table_name = arena_candlesticks)]
pub struct ArenaCandlestickModel {
    pub melee_id: BigDecimal,
    pub last_transaction_version: i64,

    pub period: Period,
    pub start_time: NaiveDateTime,

    pub open_price: BigDecimal,
    pub high_price: BigDecimal,
    pub low_price: BigDecimal,
    pub close_price: BigDecimal,
    pub volume: BigDecimal,
    pub n_swaps: BigDecimal,
}

impl ArenaCandlestickModel {
    fn truncate(value: BigDecimal) -> BigDecimal {
        value.with_precision_round(CANDLESTICK_DECIMALS, RoundingMode::HalfEven)
    }
}

impl From<ArenaCandlestickDiffModelBuilder> for ArenaCandlestickModel {
    fn from(value: ArenaCandlestickDiffModelBuilder) -> Self {
        Self {
            melee_id: value.melee_id,
            last_transaction_version: value.last_transaction_version,

            period: value.period,
            start_time: value.start_time,

            open_price: Self::truncate(value.open_price),
            high_price: Self::truncate(value.high_price),
            low_price: Self::truncate(value.low_price),
            close_price: Self::truncate(value.close_price),

            volume: value.volume,
            n_swaps: value.n_swaps,
        }
    }
}

pub type AllArenaCandlestickColumns = (
    BigDecimal,
    i64,
    crate::db::common::models::emojicoin_models::enums::Period,
    chrono::NaiveDateTime,
    BigDecimal,
    BigDecimal,
    BigDecimal,
    BigDecimal,
    BigDecimal,
    BigDecimal,
);

impl From<AllArenaCandlestickColumns> for ArenaCandlestickModel {
    fn from(value: AllArenaCandlestickColumns) -> Self {
        Self {
            melee_id: value.0,
            last_transaction_version: value.1,
            period: value.2,
            start_time: value.3,
            open_price: value.4,
            high_price: value.5,
            low_price: value.6,
            close_price: value.7,
            volume: value.8,
            n_swaps: value.9,
        }
    }
}
