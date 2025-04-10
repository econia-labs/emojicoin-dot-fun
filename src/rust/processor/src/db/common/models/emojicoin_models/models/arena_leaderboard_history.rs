use crate::processor::MeleeData;
use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ArenaLeaderboardHistoryPartialModel {
    pub melee_id: BigDecimal,
    pub last_transaction_version: i64,

    pub emojicoin_0_price: BigDecimal,
    pub emojicoin_1_price: BigDecimal,
}

impl ArenaLeaderboardHistoryPartialModel {
    pub fn new(
        melee_data: &MeleeData,
        last_transaction_version: i64,
    ) -> ArenaLeaderboardHistoryPartialModel {
        ArenaLeaderboardHistoryPartialModel {
            melee_id: melee_data.melee_id.clone(),
            last_transaction_version,
            emojicoin_0_price: melee_data.price_0.clone(),
            emojicoin_1_price: melee_data.price_1.clone(),
        }
    }
}
