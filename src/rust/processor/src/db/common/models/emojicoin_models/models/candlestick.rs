use crate::{
    db::common::models::emojicoin_models::{
        constants::{CANDLESTICK_DECIMALS, NORMAL_CANDLESTICK_PERIODS},
        enums::Period,
        json_types::{StateEvent, TxnInfo},
        parsers::emojis::parser::symbol_bytes_to_emojis,
    },
    schema::candlesticks,
};
use bigdecimal::{BigDecimal, RoundingMode};
use chrono::{DurationRound, NaiveDateTime};
use field_count::FieldCount;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone)]
pub struct CandlestickDiffModelBuilder {
    pub market_id: BigDecimal,
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

    pub symbol_emojis: Vec<String>,
}

impl CandlestickDiffModelBuilder {
    pub fn merge(sticks: Vec<Self>) -> Vec<Self> {
        let mut sticks_map: HashMap<(BigDecimal, Period, NaiveDateTime), Self> = HashMap::new();

        for stick in sticks {
            let stick_clone = stick.clone();
            sticks_map
                .entry((stick.market_id.clone(), stick.period, stick.start_time))
                .and_modify(|s| {
                    s.last_transaction_version = s
                        .last_transaction_version
                        .max(stick.last_transaction_version);
                    s.volume += stick.volume;
                    s.high_price = s.high_price.clone().max(stick.high_price);
                    s.low_price = s.low_price.clone().min(stick.low_price);
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
        state: &StateEvent,
        swap_timestamp: (i64, i64),
    ) -> Vec<Self> {
        let mut candlesticks: Vec<Self> = vec![];

        for &period in NORMAL_CANDLESTICK_PERIODS.iter() {
            let start_time = txn_info
                .timestamp
                .duration_trunc(period.to_time_delta())
                .unwrap();
            let symbol_emojis = symbol_bytes_to_emojis(&state.market_metadata.emoji_bytes);
            let price = state.curve_price();
            let x = Self {
                market_id: state.market_metadata.market_id.clone(),
                last_transaction_version: txn_info.version,
                period,
                start_time,
                open_price: price.clone(),
                high_price: price.clone(),
                low_price: price.clone(),
                close_price: price,
                close_timestamp: swap_timestamp,
                open_timestamp: swap_timestamp,
                symbol_emojis,
                volume: state.last_swap.quote_volume.clone(),
            };
            candlesticks.push(x);
        }
        candlesticks
    }
}
#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(market_id, period, start_time))]
#[diesel(table_name = candlesticks)]
pub struct CandlestickModel {
    pub market_id: BigDecimal,
    pub last_transaction_version: i64,

    pub period: Period,
    pub start_time: NaiveDateTime,

    pub open_price: BigDecimal,
    pub high_price: BigDecimal,
    pub low_price: BigDecimal,
    pub close_price: BigDecimal,

    pub volume: BigDecimal,

    pub symbol_emojis: Vec<String>,
}

impl CandlestickModel {
    fn truncate(value: BigDecimal) -> BigDecimal {
        value.with_precision_round(CANDLESTICK_DECIMALS, RoundingMode::HalfEven)
    }
}

impl From<CandlestickDiffModelBuilder> for CandlestickModel {
    fn from(value: CandlestickDiffModelBuilder) -> Self {
        Self {
            market_id: value.market_id,
            last_transaction_version: value.last_transaction_version,

            period: value.period,
            start_time: value.start_time,

            open_price: Self::truncate(value.open_price),
            high_price: Self::truncate(value.high_price),
            low_price: Self::truncate(value.low_price),
            close_price: Self::truncate(value.close_price),

            volume: value.volume,

            symbol_emojis: value.symbol_emojis,
        }
    }
}

pub type AllCandlestickColumns = (
    BigDecimal,
    i64,
    crate::db::common::models::emojicoin_models::enums::Period,
    chrono::NaiveDateTime,
    BigDecimal,
    BigDecimal,
    BigDecimal,
    BigDecimal,
    BigDecimal,
    Vec<Option<String>>,
);

impl From<AllCandlestickColumns> for CandlestickModel {
    fn from(value: AllCandlestickColumns) -> Self {
        Self {
            market_id: value.0,
            last_transaction_version: value.1,
            period: value.2,
            start_time: value.3,
            open_price: value.4,
            high_price: value.5,
            low_price: value.6,
            close_price: value.7,
            volume: value.8,
            symbol_emojis: value.9.into_iter().map(Option::unwrap).collect(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeDelta;
    use num::Zero;

    #[test]
    fn merge() {
        let start_time =
            NaiveDateTime::parse_from_str("2025-01-01 00:00:00", "%Y-%m-%d %H:%M:%S").unwrap();
        let symbol_emojis = vec!["test".to_string()];
        let c1 = CandlestickDiffModelBuilder {
            market_id: BigDecimal::zero(),
            last_transaction_version: 12,

            period: Period::OneMinute,
            start_time,

            open_price: BigDecimal::from(50),
            high_price: BigDecimal::from(50),
            low_price: BigDecimal::from(50),
            close_price: BigDecimal::from(50),

            open_timestamp: (12, 0),
            close_timestamp: (12, 0),

            symbol_emojis: symbol_emojis.clone(),

            volume: BigDecimal::from(100),
        };
        let c2 = CandlestickDiffModelBuilder {
            market_id: BigDecimal::zero(),
            last_transaction_version: 15,

            period: Period::OneMinute,
            start_time,

            open_price: BigDecimal::from(40),
            high_price: BigDecimal::from(40),
            low_price: BigDecimal::from(40),
            close_price: BigDecimal::from(40),

            open_timestamp: (15, 0),
            close_timestamp: (15, 0),

            symbol_emojis: symbol_emojis.clone(),

            volume: BigDecimal::from(80),
        };
        // This one should not merge with the first two as it does not have the same period.
        let c3 = CandlestickDiffModelBuilder {
            market_id: BigDecimal::zero(),
            last_transaction_version: 15,

            period: Period::OneHour,
            start_time,

            open_price: BigDecimal::from(40),
            high_price: BigDecimal::from(40),
            low_price: BigDecimal::from(40),
            close_price: BigDecimal::from(40),

            open_timestamp: (15, 0),
            close_timestamp: (15, 0),

            symbol_emojis: symbol_emojis.clone(),

            volume: BigDecimal::from(80),
        };
        // This one should not merge with the first two as it does not have the same start time.
        let c4 = CandlestickDiffModelBuilder {
            market_id: BigDecimal::zero(),
            last_transaction_version: 15,

            period: Period::OneMinute,
            start_time: start_time
                .checked_add_signed(TimeDelta::minutes(1))
                .unwrap(),

            open_price: BigDecimal::from(40),
            high_price: BigDecimal::from(40),
            low_price: BigDecimal::from(40),
            close_price: BigDecimal::from(40),

            open_timestamp: (15, 0),
            close_timestamp: (15, 0),

            symbol_emojis: symbol_emojis.clone(),

            volume: BigDecimal::from(80),
        };
        // This one should not merge with the first two as it does not have the same market id.
        let c5 = CandlestickDiffModelBuilder {
            market_id: BigDecimal::from(1),
            last_transaction_version: 15,

            period: Period::OneMinute,
            start_time,

            open_price: BigDecimal::from(40),
            high_price: BigDecimal::from(40),
            low_price: BigDecimal::from(40),
            close_price: BigDecimal::from(40),

            open_timestamp: (15, 0),
            close_timestamp: (15, 0),

            symbol_emojis: symbol_emojis.clone(),

            volume: BigDecimal::from(80),
        };

        // candlestick|start time         |period|ohlc       |version|open/close|volume|mkt id
        // -----------|-------------------|------|-----------|-------|----------|------|------
        // c1         |2025-01-01 00:00:00|1m    |50,50,50,50|12     |12/12     |100   |0
        // c2         |2025-01-01 00:00:00|1m    |40,40,40,40|15     |15/15     |80    |0
        // c3         |2025-01-01 00:00:00|1h    |40,40,40,40|15     |15/15     |80    |0
        // c4         |2025-01-01 00:01:00|1m    |40,40,40,40|15     |15/15     |80    |0
        // c5         |2025-01-01 00:00:00|1m    |40,40,40,40|15     |15/15     |80    |1

        let c = CandlestickDiffModelBuilder::merge(vec![
            c1.clone(),
            c2.clone(),
            c3.clone(),
            c4.clone(),
            c5.clone(),
        ]);
        assert_eq!(c.len(), 4);

        // This should be the result of the first two merged candlesticks.
        let merged = c
            .iter()
            .find(|e| {
                e.market_id == c1.market_id
                    && e.period == c1.period
                    && e.start_time == c1.start_time
            })
            .unwrap();

        assert_eq!(merged.last_transaction_version, c2.last_transaction_version);
        assert_eq!(merged.open_price, c1.open_price);
        assert_eq!(merged.high_price, c1.high_price);
        assert_eq!(merged.low_price, c2.low_price);
        assert_eq!(merged.close_price, c2.close_price);
        assert_eq!(merged.symbol_emojis, c1.symbol_emojis);
        assert_eq!(merged.volume, c1.volume + c2.volume);

        // These should not have changed at all.
        let new_c3 = c.iter().find(|e| e.period == c3.period).unwrap();
        let new_c4 = c.iter().find(|e| e.start_time == c4.start_time).unwrap();
        let new_c5 = c.iter().find(|e| e.market_id == c5.market_id).unwrap();

        assert_eq!(new_c3.market_id, c3.market_id);
        assert_eq!(new_c3.last_transaction_version, c3.last_transaction_version);
        assert_eq!(new_c3.start_time, c3.start_time);
        assert_eq!(new_c3.open_price, c3.open_price);
        assert_eq!(new_c3.high_price, c3.high_price);
        assert_eq!(new_c3.low_price, c3.low_price);
        assert_eq!(new_c3.close_price, c3.close_price);
        assert_eq!(new_c3.symbol_emojis, c3.symbol_emojis);
        assert_eq!(new_c3.volume, c3.volume);
        assert_eq!(new_c4.market_id, c4.market_id);
        assert_eq!(new_c4.last_transaction_version, c4.last_transaction_version);
        assert_eq!(new_c4.period, c4.period);
        assert_eq!(new_c4.open_price, c4.open_price);
        assert_eq!(new_c4.high_price, c4.high_price);
        assert_eq!(new_c4.low_price, c4.low_price);
        assert_eq!(new_c4.close_price, c4.close_price);
        assert_eq!(new_c4.symbol_emojis, c4.symbol_emojis);
        assert_eq!(new_c4.volume, c4.volume);
        assert_eq!(new_c5.last_transaction_version, c5.last_transaction_version);
        assert_eq!(new_c5.period, c5.period);
        assert_eq!(new_c5.start_time, c5.start_time);
        assert_eq!(new_c5.open_price, c5.open_price);
        assert_eq!(new_c5.high_price, c5.high_price);
        assert_eq!(new_c5.low_price, c5.low_price);
        assert_eq!(new_c5.close_price, c5.close_price);
        assert_eq!(new_c5.symbol_emojis, c5.symbol_emojis);
        assert_eq!(new_c5.volume, c5.volume);
    }

    #[test]
    fn build() {
        let start_time =
            NaiveDateTime::parse_from_str("2025-01-01 00:00:00", "%Y-%m-%d %H:%M:%S").unwrap();
        let symbol_emojis = vec!["test".to_string()];
        let builder = CandlestickDiffModelBuilder {
            market_id: BigDecimal::zero(),
            last_transaction_version: 12,

            period: Period::OneMinute,
            start_time,

            open_price: BigDecimal::from(50),
            high_price: BigDecimal::from(50),
            low_price: BigDecimal::from(50),
            close_price: BigDecimal::from(50),

            open_timestamp: (12, 0),
            close_timestamp: (12, 0),

            symbol_emojis: symbol_emojis.clone(),

            volume: BigDecimal::from(100),
        };

        let candlestick: CandlestickModel = builder.clone().into();

        assert_eq!(candlestick.market_id, builder.market_id);
        assert_eq!(
            candlestick.last_transaction_version,
            builder.last_transaction_version
        );
        assert_eq!(candlestick.period, builder.period);
        assert_eq!(candlestick.start_time, builder.start_time);
        assert_eq!(candlestick.open_price, builder.open_price);
        assert_eq!(candlestick.high_price, builder.high_price);
        assert_eq!(candlestick.low_price, builder.low_price);
        assert_eq!(candlestick.close_price, builder.close_price);
        assert_eq!(candlestick.symbol_emojis, builder.symbol_emojis);
        assert_eq!(candlestick.volume, builder.volume);
    }
}
