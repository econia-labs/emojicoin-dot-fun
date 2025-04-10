use crate::{
    db::common::models::emojicoin_models::json_types::{ArenaExitEvent, TxnInfo},
    processor::MeleeData,
    schema::arena_exit_events,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(transaction_version, event_index))]
#[diesel(table_name = arena_exit_events)]
pub struct ArenaExitEventModel {
    // Transaction metadata.
    pub transaction_version: i64,
    pub event_index: i64,
    pub sender: String,
    pub entry_function: Option<String>,
    pub transaction_timestamp: chrono::NaiveDateTime,

    pub user: String,
    pub melee_id: BigDecimal,
    pub tap_out_fee: BigDecimal,

    pub emojicoin_0_proceeds: BigDecimal,
    pub emojicoin_1_proceeds: BigDecimal,
    pub apt_proceeds: BigDecimal,
    pub emojicoin_0_exchange_rate_base: BigDecimal,
    pub emojicoin_0_exchange_rate_quote: BigDecimal,
    pub emojicoin_1_exchange_rate_base: BigDecimal,
    pub emojicoin_1_exchange_rate_quote: BigDecimal,

    pub during_melee: bool,
}

impl ArenaExitEventModel {
    pub fn new(
        txn_info: TxnInfo,
        arena_exit_event: ArenaExitEvent,
        melee_data: &MeleeData,
    ) -> ArenaExitEventModel {
        ArenaExitEventModel {
            // Transaction metadata.
            transaction_version: txn_info.version,
            event_index: arena_exit_event.event_index,
            sender: txn_info.sender.clone(),
            entry_function: txn_info.entry_function.clone(),
            transaction_timestamp: txn_info.timestamp,

            user: arena_exit_event.user,
            during_melee: melee_data.melee_id == arena_exit_event.melee_id,
            melee_id: arena_exit_event.melee_id,
            tap_out_fee: arena_exit_event.tap_out_fee,

            emojicoin_0_proceeds: arena_exit_event.emojicoin_0_proceeds.clone(),
            emojicoin_1_proceeds: arena_exit_event.emojicoin_1_proceeds.clone(),
            apt_proceeds: (arena_exit_event.emojicoin_0_proceeds
                / arena_exit_event.emojicoin_0_exchange_rate.base.clone()
                * arena_exit_event.emojicoin_0_exchange_rate.quote.clone()
                + arena_exit_event.emojicoin_1_proceeds
                    / arena_exit_event.emojicoin_1_exchange_rate.base.clone()
                    * arena_exit_event.emojicoin_1_exchange_rate.quote.clone())
            .round(0),
            emojicoin_0_exchange_rate_base: arena_exit_event.emojicoin_0_exchange_rate.base,
            emojicoin_0_exchange_rate_quote: arena_exit_event.emojicoin_0_exchange_rate.quote,
            emojicoin_1_exchange_rate_base: arena_exit_event.emojicoin_1_exchange_rate.base,
            emojicoin_1_exchange_rate_quote: arena_exit_event.emojicoin_1_exchange_rate.quote,
        }
    }
}
