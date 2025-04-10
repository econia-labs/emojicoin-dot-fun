use crate::{
    db::common::models::emojicoin_models::{
        json_types::{ArenaMeleeEvent, TxnInfo},
        utils::micros_to_naive_datetime,
    },
    schema::arena_melee_events,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(melee_id))]
#[diesel(table_name = arena_melee_events)]
pub struct ArenaMeleeEventModel {
    // Transaction metadata.
    pub transaction_version: i64,
    pub event_index: i64,
    pub sender: String,
    pub entry_function: Option<String>,
    pub transaction_timestamp: chrono::NaiveDateTime,

    pub melee_id: BigDecimal,
    pub emojicoin_0_market_address: String,
    pub emojicoin_1_market_address: String,
    pub start_time: chrono::NaiveDateTime,
    pub duration: BigDecimal,
    pub max_match_percentage: BigDecimal,
    pub max_match_amount: BigDecimal,
    pub available_rewards: BigDecimal,
}

impl ArenaMeleeEventModel {
    pub fn new(txn_info: TxnInfo, arena_melee_event: ArenaMeleeEvent) -> ArenaMeleeEventModel {
        ArenaMeleeEventModel {
            // Transaction metadata.
            transaction_version: txn_info.version,
            event_index: arena_melee_event.event_index,
            sender: txn_info.sender.clone(),
            entry_function: txn_info.entry_function.clone(),
            transaction_timestamp: txn_info.timestamp,

            melee_id: arena_melee_event.melee_id,
            emojicoin_0_market_address: arena_melee_event.emojicoin_0_market_address,
            emojicoin_1_market_address: arena_melee_event.emojicoin_1_market_address,
            start_time: micros_to_naive_datetime(&arena_melee_event.start_time),
            duration: arena_melee_event.duration,
            max_match_percentage: arena_melee_event.max_match_percentage,
            max_match_amount: arena_melee_event.max_match_amount,
            available_rewards: arena_melee_event.available_rewards,
        }
    }
}
