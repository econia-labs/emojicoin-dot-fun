use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};

use crate::util::{deserialize_from_string, serialize_to_string};

use super::structs::*;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum ArenaEvent {
    Melee(Melee),
    Enter(Enter),
    Exit(Exit),
    Swap(Swap),
    VaultBalanceUpdate(VaultBalanceUpdate),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Melee {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: u64,
    pub emojicoin_0_market_address: String,
    pub emojicoin_1_market_address: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub start_time: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub duration: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub max_match_percentage: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub max_match_amount: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub available_rewards: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Enter {
    pub user: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub input_amount: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub match_amount: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_0_proceeds: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_1_proceeds: u64,
    pub emojicoin_0_exchange_rate: ExchangeRate,
    pub emojicoin_1_exchange_rate: ExchangeRate,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Exit {
    pub user: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub tap_out_fee: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_0_proceeds: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_1_proceeds: u64,
    pub emojicoin_0_exchange_rate: ExchangeRate,
    pub emojicoin_1_exchange_rate: ExchangeRate,
}

impl Exit {
    pub fn apt_proceeds(&self) -> BigDecimal {
        let apt_proceeds_from_emojicoin_0 =
            BigDecimal::from(self.emojicoin_0_proceeds) / self.emojicoin_0_exchange_rate.price();
        let apt_proceeds_from_emojicoin_1 =
            BigDecimal::from(self.emojicoin_1_proceeds) / self.emojicoin_1_exchange_rate.price();
        apt_proceeds_from_emojicoin_0 + apt_proceeds_from_emojicoin_1
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Swap {
    pub user: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_0_proceeds: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_1_proceeds: u64,
    pub emojicoin_0_exchange_rate: ExchangeRate,
    pub emojicoin_1_exchange_rate: ExchangeRate,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VaultBalanceUpdate {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub new_balance: u64,
}
