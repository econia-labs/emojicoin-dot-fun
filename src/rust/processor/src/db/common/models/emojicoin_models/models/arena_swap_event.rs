use crate::{
    db::common::models::emojicoin_models::json_types::{ArenaSwapEvent, TxnInfo},
    processor::MeleeData,
    schema::arena_swap_events,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(transaction_version, event_index))]
#[diesel(table_name = arena_swap_events)]
pub struct ArenaSwapEventModel {
    // Transaction metadata.
    pub transaction_version: i64,
    pub event_index: i64,
    pub sender: String,
    pub entry_function: Option<String>,
    pub transaction_timestamp: chrono::NaiveDateTime,

    pub user: String,
    pub melee_id: BigDecimal,
    pub quote_volume: BigDecimal,
    pub integrator_fee: BigDecimal,

    pub emojicoin_0_proceeds: BigDecimal,
    pub emojicoin_1_proceeds: BigDecimal,
    pub emojicoin_0_exchange_rate_base: BigDecimal,
    pub emojicoin_0_exchange_rate_quote: BigDecimal,
    pub emojicoin_1_exchange_rate_base: BigDecimal,
    pub emojicoin_1_exchange_rate_quote: BigDecimal,

    pub during_melee: bool,
}

impl ArenaSwapEventModel {
    pub fn new(
        txn_info: TxnInfo,
        arena_swap_event: ArenaSwapEvent,
        melee_data: &MeleeData,
    ) -> ArenaSwapEventModel {
        ArenaSwapEventModel {
            // Transaction metadata.
            transaction_version: txn_info.version,
            event_index: arena_swap_event.event_index,
            sender: txn_info.sender.clone(),
            entry_function: txn_info.entry_function.clone(),
            transaction_timestamp: txn_info.timestamp,

            user: arena_swap_event.user,
            during_melee: melee_data.melee_id == arena_swap_event.melee_id,
            melee_id: arena_swap_event.melee_id,
            quote_volume: arena_swap_event.quote_volume,
            integrator_fee: arena_swap_event.integrator_fee,

            emojicoin_0_proceeds: arena_swap_event.emojicoin_0_proceeds,
            emojicoin_1_proceeds: arena_swap_event.emojicoin_1_proceeds,
            emojicoin_0_exchange_rate_base: arena_swap_event.emojicoin_0_exchange_rate.base,
            emojicoin_0_exchange_rate_quote: arena_swap_event.emojicoin_0_exchange_rate.quote,
            emojicoin_1_exchange_rate_base: arena_swap_event.emojicoin_1_exchange_rate.base,
            emojicoin_1_exchange_rate_quote: arena_swap_event.emojicoin_1_exchange_rate.quote,
        }
    }
}
