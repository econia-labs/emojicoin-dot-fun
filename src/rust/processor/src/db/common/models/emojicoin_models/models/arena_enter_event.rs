use crate::{
    db::common::models::emojicoin_models::json_types::{ArenaEnterEvent, TxnInfo},
    schema::arena_enter_events,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(transaction_version, event_index))]
#[diesel(table_name = arena_enter_events)]
pub struct ArenaEnterEventModel {
    // Transaction metadata.
    pub transaction_version: i64,
    pub event_index: i64,
    pub sender: String,
    pub entry_function: Option<String>,
    pub transaction_timestamp: chrono::NaiveDateTime,

    pub user: String,
    pub melee_id: BigDecimal,
    pub input_amount: BigDecimal,
    pub quote_volume: BigDecimal,
    pub integrator_fee: BigDecimal,
    pub match_amount: BigDecimal,

    pub emojicoin_0_proceeds: BigDecimal,
    pub emojicoin_1_proceeds: BigDecimal,
    pub emojicoin_0_exchange_rate_base: BigDecimal,
    pub emojicoin_0_exchange_rate_quote: BigDecimal,
    pub emojicoin_1_exchange_rate_base: BigDecimal,
    pub emojicoin_1_exchange_rate_quote: BigDecimal,
}

impl ArenaEnterEventModel {
    pub fn new(txn_info: TxnInfo, arena_enter_event: ArenaEnterEvent) -> ArenaEnterEventModel {
        ArenaEnterEventModel {
            // Transaction metadata.
            transaction_version: txn_info.version,
            event_index: arena_enter_event.event_index,
            sender: txn_info.sender.clone(),
            entry_function: txn_info.entry_function.clone(),
            transaction_timestamp: txn_info.timestamp,

            user: arena_enter_event.user,
            melee_id: arena_enter_event.melee_id,
            input_amount: arena_enter_event.input_amount,
            quote_volume: arena_enter_event.quote_volume,
            integrator_fee: arena_enter_event.integrator_fee,
            match_amount: arena_enter_event.match_amount,

            emojicoin_0_proceeds: arena_enter_event.emojicoin_0_proceeds,
            emojicoin_1_proceeds: arena_enter_event.emojicoin_1_proceeds,
            emojicoin_0_exchange_rate_base: arena_enter_event.emojicoin_0_exchange_rate.base,
            emojicoin_0_exchange_rate_quote: arena_enter_event.emojicoin_0_exchange_rate.quote,
            emojicoin_1_exchange_rate_base: arena_enter_event.emojicoin_1_exchange_rate.base,
            emojicoin_1_exchange_rate_quote: arena_enter_event.emojicoin_1_exchange_rate.quote,
        }
    }
}
