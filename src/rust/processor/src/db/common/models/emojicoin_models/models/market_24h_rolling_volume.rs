use crate::db::common::models::emojicoin_models::{
    enums::Period,
    json_types::EventWithMarket,
    utils::{micros_to_naive_datetime, within_past_day},
};
use bigdecimal::BigDecimal;
use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct RecentOneMinutePeriodicStateEvent {
    pub market_id: BigDecimal,
    pub market_nonce: BigDecimal,
    pub transaction_version: i64,
    pub period_quote_volume: BigDecimal,
    pub period_base_volume: BigDecimal,
    pub start_time: NaiveDateTime,
}

// Recent being defined as within the last day.
// Note that the time filtering logic here is primarily to avoid calculating volume
// and inserting 1m events while backfilling.
// The actual time filtering logic for the API is in the database view.
impl RecentOneMinutePeriodicStateEvent {
    pub fn try_from_event(event: EventWithMarket, version: i64) -> Option<Self> {
        match event {
            EventWithMarket::PeriodicState(pse) => {
                let (period, start_time) = (
                    pse.periodic_state_metadata.period,
                    micros_to_naive_datetime(&pse.periodic_state_metadata.start_time),
                );

                if period == Period::OneMinute && within_past_day(start_time) {
                    Some(RecentOneMinutePeriodicStateEvent {
                        market_id: pse.market_metadata.market_id,
                        market_nonce: pse.periodic_state_metadata.emit_market_nonce,
                        transaction_version: version,
                        period_quote_volume: pse.volume_quote.clone(),
                        period_base_volume: pse.volume_base.clone(),
                        start_time,
                    })
                } else {
                    None
                }
            }
            _ => None,
        }
    }
}
