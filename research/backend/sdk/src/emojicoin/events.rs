use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};

use crate::{
    scn::Scn,
    util::{
        deserialize_from_aggregator, deserialize_from_string, serialize_to_aggregator,
        serialize_to_string,
    },
};

use super::structs::*;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum EmojicoinEvent {
    GlobalState(GlobalState),
    State(State),
    PeriodicState(PeriodicState),
    MarketRegistration(MarketRegistration),
    Swap(Swap),
    Chat(Chat),
    Liquidity(Liquidity),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GlobalState {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_time: u64,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub registry_nonce: u64,
    pub trigger: u8,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub cumulative_quote_volume: u128,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub total_quote_locked: u128,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub total_value_locked: u128,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub market_cap: u128,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub fully_diluted_value: u128,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub cumulative_integrator_fees: u128,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub cumulative_swaps: u64,
    #[serde(deserialize_with = "deserialize_from_aggregator")]
    #[serde(serialize_with = "serialize_to_aggregator")]
    pub cumulative_chat_messages: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct State {
    pub market_metadata: MarketMetadata,
    pub state_metadata: StateMetadata,
    pub clamm_virtual_reserves: Reserves,
    pub cpamm_real_reserves: Reserves,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub lp_coin_supply: u128,
    pub cumulative_stats: CumulativeStats,
    pub instantaneous_stats: InstantaneousStats,
    pub last_swap: LastSwap,
}

impl Scn for State {
    fn emoji_bytes(&self) -> Vec<u8> {
        self.market_metadata.emoji_bytes.clone()
    }
}

impl State {
    pub fn price(&self) -> BigDecimal {
        if self.lp_coin_supply > 0 {
            BigDecimal::from(self.cpamm_real_reserves.quote) / self.cpamm_real_reserves.base
        } else {
            BigDecimal::from(self.clamm_virtual_reserves.quote) / self.clamm_virtual_reserves.base
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PeriodicState {
    pub market_metadata: MarketMetadata,
    pub periodic_state_metadata: PeriodicStateMetadata,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub open_price_q64: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub high_price_q64: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub low_price_q64: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub close_price_q64: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub volume_base: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub volume_quote: u128,
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
    pub starts_in_bonding_curve: bool,
    pub ends_in_bonding_curve: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub tvl_per_lp_coin_growth_q64: u128,
}

impl Scn for PeriodicState {
    fn emoji_bytes(&self) -> Vec<u8> {
        self.market_metadata.emoji_bytes.clone()
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MarketRegistration {
    pub market_metadata: MarketMetadata,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: u64,
    pub registrant: String,
    pub integrator: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: u64,
}

impl Scn for MarketRegistration {
    fn emoji_bytes(&self) -> Vec<u8> {
        self.market_metadata.emoji_bytes.clone()
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Swap {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_id: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_nonce: u64,
    pub swapper: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub input_amount: u64,
    pub is_sell: bool,
    pub integrator: String,
    pub integrator_fee_rate_bps: u8,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub net_proceeds: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_volume: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub avg_execution_price_q64: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fee: u64,
    pub starts_in_bonding_curve: bool,
    pub results_in_state_transition: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub balance_as_fraction_of_circulating_supply_before_q64: u128,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub balance_as_fraction_of_circulating_supply_after_q64: u128,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Chat {
    pub market_metadata: MarketMetadata,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_time: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_market_nonce: u64,
    pub user: String,
    pub message: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub user_emojicoin_balance: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub circulating_supply: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub balance_as_fraction_of_circulating_supply_q64: u128,
}

impl Scn for Chat {
    fn emoji_bytes(&self) -> Vec<u8> {
        self.market_metadata.emoji_bytes.clone()
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Liquidity {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_id: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_nonce: u64,
    pub provider: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_amount: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_amount: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub lp_coin_amount: u64,
    pub liquidity_provided: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_donation_claim_amount: u64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_donation_claim_amount: u64,
}
