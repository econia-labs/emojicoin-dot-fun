use crate::{
    db::common::models::emojicoin_models::json_types::{
        ArenaEnterEvent, ArenaExitEvent, ArenaSwapEvent, StateEvent, TxnInfo,
    },
    schema::arena_position,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use num::Zero;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(melee_id))]
#[diesel(table_name = arena_position)]
/// Arena position difference model.
///
/// The fields represent not the amount after an event, but the difference in that amount generated
/// by the event.
///
/// For example, an enter would produce the following model:
///
/// ```json5
/// {
///     // ...
///     "emojicoin_0_balance": 123,
///     "emojicoin_1_balance": 0,
///     // ...
/// }
/// ```
///
/// And a subsequent swap would produce:
///
/// ```json5
/// {
///     // ...
///     "emojicoin_0_balance": -123,
///     "emojicoin_1_balance": 987,
///     // ...
/// }
/// ```
///
/// This means that we can insert events into the database out of order without risking to insert
/// outdated data.
pub struct ArenaPositionDiffModel {
    pub user: String,
    pub last_transaction_version: i64,
    pub melee_id: BigDecimal,
    pub open: bool,
    pub emojicoin_0_balance: BigDecimal,
    pub emojicoin_1_balance: BigDecimal,
    pub withdrawals: BigDecimal,
    pub deposits: BigDecimal,
    pub match_amount: BigDecimal,
    pub last_exit_0: Option<bool>,
}

impl ArenaPositionDiffModel {
    pub fn from_enter(
        txn_info: &TxnInfo,
        arena_enter_event: ArenaEnterEvent,
    ) -> ArenaPositionDiffModel {
        ArenaPositionDiffModel {
            user: arena_enter_event.user,
            last_transaction_version: txn_info.version,
            melee_id: arena_enter_event.melee_id,
            open: true,
            emojicoin_0_balance: arena_enter_event.emojicoin_0_proceeds,
            emojicoin_1_balance: arena_enter_event.emojicoin_1_proceeds,
            withdrawals: BigDecimal::zero(),
            deposits: arena_enter_event.input_amount,
            match_amount: arena_enter_event.match_amount,
            last_exit_0: None,
        }
    }

    pub fn from_exit(
        txn_info: &TxnInfo,
        arena_exit_event: ArenaExitEvent,
    ) -> ArenaPositionDiffModel {
        ArenaPositionDiffModel {
            user: arena_exit_event.user,
            last_transaction_version: txn_info.version,
            melee_id: arena_exit_event.melee_id,
            open: false,
            emojicoin_0_balance: -arena_exit_event.emojicoin_0_proceeds.clone(),
            emojicoin_1_balance: -arena_exit_event.emojicoin_1_proceeds.clone(),
            withdrawals: (arena_exit_event.emojicoin_0_proceeds
                / arena_exit_event.emojicoin_0_exchange_rate.base
                * arena_exit_event.emojicoin_0_exchange_rate.quote
                + arena_exit_event.emojicoin_1_proceeds.clone()
                    / arena_exit_event.emojicoin_1_exchange_rate.base
                    * arena_exit_event.emojicoin_1_exchange_rate.quote)
                .round(0),
            deposits: BigDecimal::zero(),
            match_amount: -arena_exit_event.tap_out_fee,
            last_exit_0: Some(arena_exit_event.emojicoin_1_proceeds.is_zero()),
        }
    }

    pub fn from_swap(
        txn_info: &TxnInfo,
        arena_swap_event: ArenaSwapEvent,
        emojicoin_0: &StateEvent,
        emojicoin_1: &StateEvent,
    ) -> ArenaPositionDiffModel {
        ArenaPositionDiffModel {
            user: arena_swap_event.user,
            last_transaction_version: txn_info.version,
            melee_id: arena_swap_event.melee_id,
            open: true,
            emojicoin_0_balance: emojicoin_0.last_swap.base_volume.clone()
                * if emojicoin_0.last_swap.is_sell { -1 } else { 1 },
            emojicoin_1_balance: emojicoin_1.last_swap.base_volume.clone()
                * if emojicoin_1.last_swap.is_sell { -1 } else { 1 },
            withdrawals: BigDecimal::zero(),
            deposits: BigDecimal::zero(),
            match_amount: BigDecimal::zero(),
            last_exit_0: None,
        }
    }

    pub fn merge(arena_positions: Vec<Self>) -> Vec<Self> {
        let mut map: HashMap<(BigDecimal, String), Self> = HashMap::new();
        for position in arena_positions {
            let position_clone = position.clone();
            map.entry((position.melee_id, position.user))
                .and_modify(|p| {
                    p.last_transaction_version = std::cmp::max(
                        p.last_transaction_version,
                        position.last_transaction_version,
                    );
                    p.open = position.open;
                    p.emojicoin_0_balance += position.emojicoin_0_balance;
                    p.emojicoin_1_balance += position.emojicoin_1_balance;
                    p.withdrawals += position.withdrawals;
                    p.deposits += position.deposits;
                    p.match_amount += position.match_amount;
                    p.last_exit_0 = position.last_exit_0;
                })
                .or_insert(position_clone);
        }
        map.into_values().collect()
    }
}
