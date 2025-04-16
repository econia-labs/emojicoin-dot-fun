use serde::{Deserialize, Serialize};

use crate::util::{
    deserialize_bytes_from_string, deserialize_from_string, serialize_bytes_to_string,
    serialize_to_string,
};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CumulativeStats {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_volume: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fees: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_base: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_quote: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_swaps: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_chat_messages: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GlobalStats {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub cumulative_quote_volume: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub total_quote_locked: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub total_value_locked: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_cap: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub fully_diluted_value: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub cumulative_integrator_fees: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub cumulative_swaps: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub cumulative_chat_messages: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct InstantaneousStats {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub total_quote_locked: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub total_value_locked: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_cap: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub fully_diluted_value: u128,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct LastSwap {
    pub is_sell: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub avg_execution_price_q64: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_volume: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub nonce: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MarketMetadata {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_id: u64,
    pub market_address: String,
    #[serde(deserialize_with = "deserialize_bytes_from_string")]
    #[serde(serialize_with = "serialize_bytes_to_string")]
    pub emoji_bytes: Vec<u8>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PeriodicStateMetadata {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub start_time: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub period: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_time: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_market_nonce: u64,
    pub trigger: u8,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct StateMetadata {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_nonce: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub bump_time: u64,
    pub trigger: u8,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Reserves {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote: u64,
}
