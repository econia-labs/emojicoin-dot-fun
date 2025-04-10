use crate::{
    db::common::models::emojicoin_models::json_types::{ArenaVaultBalanceUpdateEvent, TxnInfo},
    schema::arena_vault_balance_update_events,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(transaction_version, event_index))]
#[diesel(table_name = arena_vault_balance_update_events)]
pub struct ArenaVaultBalanceUpdateEventModel {
    // Transaction metadata.
    pub transaction_version: i64,
    pub event_index: i64,
    pub sender: String,
    pub entry_function: Option<String>,
    pub transaction_timestamp: chrono::NaiveDateTime,

    pub new_balance: BigDecimal,
}

impl ArenaVaultBalanceUpdateEventModel {
    pub fn new(
        txn_info: TxnInfo,
        arena_vault_balance_update_event: ArenaVaultBalanceUpdateEvent,
    ) -> ArenaVaultBalanceUpdateEventModel {
        ArenaVaultBalanceUpdateEventModel {
            // Transaction metadata.
            transaction_version: txn_info.version,
            event_index: arena_vault_balance_update_event.event_index,
            sender: txn_info.sender.clone(),
            entry_function: txn_info.entry_function.clone(),
            transaction_timestamp: txn_info.timestamp,

            new_balance: arena_vault_balance_update_event.new_balance,
        }
    }
}
