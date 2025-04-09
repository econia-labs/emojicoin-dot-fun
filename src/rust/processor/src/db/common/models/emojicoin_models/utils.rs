use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDateTime};
use num::ToPrimitive;

pub fn micros_to_naive_datetime(microseconds: &BigDecimal) -> NaiveDateTime {
    // There should be no truncation issues for almost ~300,000 years.
    let micros_i64 = BigDecimal::to_i64(microseconds)
        .expect("Microsecond values should always be representable as an i64.");
    DateTime::from_timestamp_micros(micros_i64)
        .expect("Should be able to convert microseconds to a DateTime and then to a NaiveDateTime.")
        .naive_utc()
}

pub fn within_past_day(time: NaiveDateTime) -> bool {
    let one_day_ago = chrono::Utc::now() - chrono::Duration::hours(24);

    time.and_utc() > one_day_ago
}
