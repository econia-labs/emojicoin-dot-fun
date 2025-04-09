use super::{
    arena_enter_event::ArenaEnterEventModel, arena_exit_event::ArenaExitEventModel,
    arena_melee_event::ArenaMeleeEventModel, arena_swap_event::ArenaSwapEventModel,
};
use crate::{
    db::common::models::emojicoin_models::json_types::{StateEvent, TxnInfo},
    schema::arena_info,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use num::Zero;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(melee_id))]
#[diesel(table_name = arena_info)]
pub struct ArenaInfoModel {
    pub melee_id: BigDecimal,
    pub last_transaction_version: i64,
    pub volume: BigDecimal,
    pub rewards_remaining: BigDecimal,
    pub emojicoin_0_locked: BigDecimal,
    pub emojicoin_1_locked: BigDecimal,

    pub emojicoin_0_market_address: String,
    pub emojicoin_1_market_address: String,
    pub emojicoin_0_market_id: BigDecimal,
    pub emojicoin_1_market_id: BigDecimal,
    pub emojicoin_0_symbols: Vec<String>,
    pub emojicoin_1_symbols: Vec<String>,
    pub start_time: chrono::NaiveDateTime,
    pub duration: BigDecimal,
    pub max_match_percentage: BigDecimal,
    pub max_match_amount: BigDecimal,
}

pub struct ArenaInfoData {
    pub emojicoin_0_market_id: BigDecimal,
    pub emojicoin_1_market_id: BigDecimal,
    pub emojicoin_0_symbols: Vec<String>,
    pub emojicoin_1_symbols: Vec<String>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ArenaInfoDiffUpdate {
    pub melee_id: BigDecimal,
    pub last_transaction_version: i64,
    pub volume: BigDecimal,
    pub rewards_remaining: BigDecimal,
    pub emojicoin_0_locked: BigDecimal,
    pub emojicoin_1_locked: BigDecimal,
}

impl ArenaInfoModel {
    pub fn new(
        txn_info: &TxnInfo,
        arena_melee_event: ArenaMeleeEventModel,
        data: ArenaInfoData,
    ) -> ArenaInfoModel {
        ArenaInfoModel {
            melee_id: arena_melee_event.melee_id,
            last_transaction_version: txn_info.version,
            volume: BigDecimal::zero(),
            rewards_remaining: arena_melee_event.available_rewards,
            emojicoin_0_locked: BigDecimal::zero(),
            emojicoin_1_locked: BigDecimal::zero(),

            emojicoin_0_market_address: arena_melee_event.emojicoin_0_market_address,
            emojicoin_1_market_address: arena_melee_event.emojicoin_1_market_address,
            emojicoin_0_market_id: data.emojicoin_0_market_id,
            emojicoin_1_market_id: data.emojicoin_1_market_id,
            emojicoin_0_symbols: data.emojicoin_0_symbols,
            emojicoin_1_symbols: data.emojicoin_1_symbols,
            start_time: arena_melee_event.start_time,
            duration: arena_melee_event.duration,
            max_match_percentage: arena_melee_event.max_match_percentage,
            max_match_amount: arena_melee_event.max_match_amount,
        }
    }
}

impl From<ArenaEnterEventModel> for ArenaInfoDiffUpdate {
    fn from(value: ArenaEnterEventModel) -> Self {
        Self {
            melee_id: value.melee_id,
            last_transaction_version: value.transaction_version,
            volume: value.quote_volume.clone(),
            rewards_remaining: -value.match_amount,
            emojicoin_0_locked: value.emojicoin_0_proceeds,
            emojicoin_1_locked: value.emojicoin_1_proceeds,
        }
    }
}

impl ArenaInfoDiffUpdate {
    pub fn from_state_events(
        value: ArenaSwapEventModel,
        emojicoin_0: &StateEvent,
        emojicoin_1: &StateEvent,
    ) -> Self {
        Self {
            melee_id: value.melee_id,
            last_transaction_version: value.transaction_version,
            volume: value.quote_volume,
            rewards_remaining: BigDecimal::zero(),
            emojicoin_0_locked: emojicoin_0.last_swap.base_volume.clone()
                * if emojicoin_0.last_swap.is_sell { -1 } else { 1 },
            emojicoin_1_locked: emojicoin_1.last_swap.base_volume.clone()
                * if emojicoin_1.last_swap.is_sell { -1 } else { 1 },
        }
    }
}
impl From<ArenaExitEventModel> for ArenaInfoDiffUpdate {
    fn from(value: ArenaExitEventModel) -> Self {
        Self {
            melee_id: value.melee_id,
            last_transaction_version: value.transaction_version,
            volume: BigDecimal::zero(),
            rewards_remaining: -value.tap_out_fee,
            emojicoin_0_locked: -value.emojicoin_0_proceeds,
            emojicoin_1_locked: -value.emojicoin_1_proceeds,
        }
    }
}

impl ArenaInfoDiffUpdate {
    pub fn merge(values: Vec<Self>) -> Vec<Self> {
        let mut map: HashMap<BigDecimal, ArenaInfoDiffUpdate> = HashMap::new();
        for value in values {
            map.entry(value.melee_id.clone())
                .and_modify(|a| {
                    a.last_transaction_version =
                        std::cmp::max(a.last_transaction_version, value.last_transaction_version);
                    a.volume += value.volume.clone();
                    a.rewards_remaining += value.rewards_remaining.clone();
                    a.emojicoin_0_locked += value.emojicoin_0_locked.clone();
                    a.emojicoin_1_locked += value.emojicoin_1_locked.clone();
                })
                .or_insert(value);
        }
        map.into_values().collect()
    }
}
