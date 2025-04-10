use super::enums::{EmojicoinTypeTag, Period, Trigger};
use crate::db::common::models::emojicoin_models::enums::{
    deserialize_state_period, deserialize_state_trigger, serialize_state_period,
    serialize_state_trigger,
};
use anyhow::{Context, Result};
use aptos_indexer_processor_sdk::{
    aptos_protos::transaction::v1::WriteResource,
    utils::{
        convert::{hex_to_raw_bytes, standardize_address},
        extract::AggregatorSnapshot,
    },
};
use bigdecimal::{BigDecimal, Zero};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::str::FromStr;

/// Serialize to string from type T
pub fn serialize_to_string<S, T>(element: &T, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
    T: std::fmt::Display,
{
    s.serialize_str(&element.to_string())
}

/// Deserialize from string to type T
pub fn deserialize_from_string<'de, D, T>(deserializer: D) -> Result<T, D::Error>
where
    D: Deserializer<'de>,
    T: FromStr,
    <T as FromStr>::Err: std::fmt::Display,
{
    use serde::de::Error;

    let s = <String>::deserialize(deserializer)?;
    s.parse::<T>().map_err(D::Error::custom)
}

pub fn serialize_bytes_to_hex_string<S>(element: &Vec<u8>, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let r = hex::encode(element);
    s.serialize_str(&format!("0x{r}"))
}

pub fn deserialize_bytes_from_hex_string<'de, D>(
    deserializer: D,
) -> core::result::Result<Vec<u8>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::Error;
    let s = <String>::deserialize(deserializer)?;
    hex_to_raw_bytes(&s).map_err(D::Error::custom)
}

pub fn deserialize_and_standardize_address<'de, D>(
    deserializer: D,
) -> core::result::Result<String, D::Error>
where
    D: Deserializer<'de>,
{
    let s = <String>::deserialize(deserializer)?;
    Ok(standardize_address(&s))
}

pub fn serialize_aggregator_snapshot<S>(element: &BigDecimal, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    (AggregatorSnapshot {
        value: element.clone(),
    })
    .serialize(s)
}

pub fn deserialize_aggregator_snapshot<'de, D>(
    deserializer: D,
) -> core::result::Result<BigDecimal, D::Error>
where
    D: Deserializer<'de>,
{
    let aggregator_snapshot = <AggregatorSnapshot>::deserialize(deserializer)?;
    Ok(aggregator_snapshot.value)
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AggregatorSnapshotI64 {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub value: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MarketMetadata {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_id: BigDecimal,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub market_address: String,
    #[serde(deserialize_with = "deserialize_bytes_from_hex_string")]
    #[serde(serialize_with = "serialize_bytes_to_hex_string")]
    pub emoji_bytes: Vec<u8>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Reserves {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PeriodicStateMetadata {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub start_time: BigDecimal,
    #[serde(deserialize_with = "deserialize_state_period")]
    #[serde(serialize_with = "serialize_state_period")]
    pub period: Period,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_time: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_market_nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_state_trigger")]
    #[serde(serialize_with = "serialize_state_trigger")]
    pub trigger: Trigger,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StateMetadata {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub bump_time: BigDecimal,
    #[serde(deserialize_with = "deserialize_state_trigger")]
    #[serde(serialize_with = "serialize_state_trigger")]
    pub trigger: Trigger,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CumulativeStats {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fees: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_base: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_quote: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_swaps: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_chat_messages: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InstantaneousStats {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub total_quote_locked: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub total_value_locked: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_cap: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub fully_diluted_value: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LastSwap {
    pub is_sell: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub avg_execution_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SwapEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_id: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub swapper: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub input_amount: BigDecimal,
    pub is_sell: bool,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub integrator: String,
    pub integrator_fee_rate_bps: i16,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub net_proceeds: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub avg_execution_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fee: BigDecimal,
    pub starts_in_bonding_curve: bool,
    pub results_in_state_transition: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    pub balance_as_fraction_of_circulating_supply_before_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    pub balance_as_fraction_of_circulating_supply_after_q64: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ChatEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    pub market_metadata: MarketMetadata,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_time: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_market_nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub user: String,
    pub message: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub user_emojicoin_balance: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub circulating_supply: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub balance_as_fraction_of_circulating_supply_q64: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MarketRegistrationEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    pub market_metadata: MarketMetadata,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: BigDecimal,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub registrant: String,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub integrator: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PeriodicStateEvent {
    pub market_metadata: MarketMetadata,
    pub periodic_state_metadata: PeriodicStateMetadata,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub open_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub high_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub low_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub close_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub volume_base: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub volume_quote: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fees: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_base: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_quote: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_swaps: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_chat_messages: BigDecimal,
    pub starts_in_bonding_curve: bool,
    pub ends_in_bonding_curve: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub tvl_per_lp_coin_growth_q64: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StateEvent {
    pub market_metadata: MarketMetadata,
    pub state_metadata: StateMetadata,
    pub clamm_virtual_reserves: Reserves,
    pub cpamm_real_reserves: Reserves,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub lp_coin_supply: BigDecimal,
    pub cumulative_stats: CumulativeStats,
    pub instantaneous_stats: InstantaneousStats,
    pub last_swap: LastSwap,
}

impl StateEvent {
    pub fn in_bonding_curve(&self) -> bool {
        self.lp_coin_supply.is_zero()
    }

    pub fn curve_price(&self) -> BigDecimal {
        if self.in_bonding_curve() {
            self.clamm_virtual_reserves.quote.clone() / self.clamm_virtual_reserves.base.clone()
        } else {
            self.cpamm_real_reserves.quote.clone() / self.cpamm_real_reserves.base.clone()
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GlobalStateEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emit_time: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub registry_nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_state_trigger")]
    #[serde(serialize_with = "serialize_state_trigger")]
    pub trigger: Trigger,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub cumulative_quote_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub total_quote_locked: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub total_value_locked: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub market_cap: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub fully_diluted_value: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub cumulative_integrator_fees: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub cumulative_swaps: BigDecimal,
    #[serde(deserialize_with = "deserialize_aggregator_snapshot")]
    #[serde(serialize_with = "serialize_aggregator_snapshot")]
    pub cumulative_chat_messages: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LiquidityEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_id: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub time: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub market_nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub provider: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_amount: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_amount: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub lp_coin_amount: BigDecimal,
    pub liquidity_provided: bool,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base_donation_claim_amount: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_donation_claim_amount: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExchangeRate {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub base: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArenaMeleeEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: BigDecimal,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub emojicoin_0_market_address: String,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub emojicoin_1_market_address: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub start_time: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub duration: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub max_match_percentage: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub max_match_amount: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub available_rewards: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArenaEnterEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub user: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub input_amount: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub match_amount: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_0_proceeds: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_1_proceeds: BigDecimal,
    pub emojicoin_0_exchange_rate: ExchangeRate,
    pub emojicoin_1_exchange_rate: ExchangeRate,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArenaExitEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub user: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub tap_out_fee: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_0_proceeds: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_1_proceeds: BigDecimal,
    pub emojicoin_0_exchange_rate: ExchangeRate,
    pub emojicoin_1_exchange_rate: ExchangeRate,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArenaSwapEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    #[serde(deserialize_with = "deserialize_and_standardize_address")]
    pub user: String,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub melee_id: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub quote_volume: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fee: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_0_proceeds: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub emojicoin_1_proceeds: BigDecimal,
    pub emojicoin_0_exchange_rate: ExchangeRate,
    pub emojicoin_1_exchange_rate: ExchangeRate,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ArenaVaultBalanceUpdateEvent {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub event_index: i64,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub new_balance: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum EventWithMarket {
    PeriodicState(PeriodicStateEvent),
    State(StateEvent),
    Swap(SwapEvent),
    Chat(ChatEvent),
    Liquidity(LiquidityEvent),
    MarketRegistration(MarketRegistrationEvent),
}

impl From<PeriodicStateEvent> for EventWithMarket {
    fn from(event: PeriodicStateEvent) -> Self {
        EventWithMarket::PeriodicState(event)
    }
}

impl From<StateEvent> for EventWithMarket {
    fn from(event: StateEvent) -> Self {
        EventWithMarket::State(event)
    }
}

impl EventWithMarket {
    pub fn from_event_type(
        event_type: &str,
        data: &str,
        txn_version: i64,
        event_index: i64,
    ) -> Result<Option<Self>> {
        match EmojicoinTypeTag::from_type_str(event_type) {
            Some(EmojicoinTypeTag::PeriodicState) => {
                serde_json::from_str(data).map(|inner| Some(Self::PeriodicState(inner)))
            }
            Some(EmojicoinTypeTag::State) => {
                serde_json::from_str(data).map(|inner| Some(Self::State(inner)))
            }
            Some(EmojicoinTypeTag::Swap) => {
                let mut json_data = serde_json::Value::from_str(data)?;
                json_data["event_index"] = serde_json::Value::from(event_index.to_string());
                serde_json::from_value(json_data).map(|inner: SwapEvent| Some(Self::Swap(inner)))
            }
            Some(EmojicoinTypeTag::Chat) => {
                let mut json_data = serde_json::Value::from_str(data)?;
                json_data["event_index"] = serde_json::Value::from(event_index.to_string());
                serde_json::from_value(json_data).map(|inner| Some(Self::Chat(inner)))
            }
            Some(EmojicoinTypeTag::MarketRegistration) => {
                let mut json_data = serde_json::Value::from_str(data)?;
                json_data["event_index"] = serde_json::Value::from(event_index.to_string());
                serde_json::from_value(json_data).map(|inner| Some(Self::MarketRegistration(inner)))
            }
            Some(EmojicoinTypeTag::Liquidity) => {
                let mut json_data = serde_json::Value::from_str(data)?;
                json_data["event_index"] = serde_json::Value::from(event_index.to_string());
                serde_json::from_value(json_data)
                    .map(|inner: LiquidityEvent| Some(Self::Liquidity(inner)))
            }
            _ => Ok(None),
        }
        .context(format!(
            "version {} failed! Failed to parse type {}, with data: {:?}",
            txn_version, event_type, data,
        ))
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ArenaEvent {
    Melee(ArenaMeleeEvent),
    Enter(ArenaEnterEvent),
    Exit(ArenaExitEvent),
    Swap(ArenaSwapEvent),
    VaultBalanceUpdate(ArenaVaultBalanceUpdateEvent),
}

impl ArenaEvent {
    pub fn from_event_type(
        event_type: &str,
        data: &str,
        txn_version: i64,
        event_index: i64,
    ) -> Result<Option<Self>> {
        // Return early if the type tag is not an emojicoin type tag.
        let emojicoin_type_tag = EmojicoinTypeTag::from_type_str(event_type);
        if emojicoin_type_tag.is_none() {
            return Ok(None);
        }

        // Insert the event index into the JSON data.
        let mut json_data = serde_json::Value::from_str(data)?;
        json_data["event_index"] = serde_json::Value::from(event_index.to_string());

        // Match arena events only, then deserialize the JSON data into arena structs.
        match emojicoin_type_tag {
            Some(EmojicoinTypeTag::ArenaMelee) => serde_json::from_value(json_data)
                .map(|inner: ArenaMeleeEvent| Some(Self::Melee(inner))),
            Some(EmojicoinTypeTag::ArenaEnter) => serde_json::from_value(json_data)
                .map(|inner: ArenaEnterEvent| Some(Self::Enter(inner))),
            Some(EmojicoinTypeTag::ArenaExit) => serde_json::from_value(json_data)
                .map(|inner: ArenaExitEvent| Some(Self::Exit(inner))),
            Some(EmojicoinTypeTag::ArenaSwap) => serde_json::from_value(json_data)
                .map(|inner: ArenaSwapEvent| Some(Self::Swap(inner))),
            Some(EmojicoinTypeTag::ArenaVaultBalanceUpdate) => serde_json::from_value(json_data)
                .map(|inner: ArenaVaultBalanceUpdateEvent| Some(Self::VaultBalanceUpdate(inner))),
            _ => Ok(None),
        }
        .context(format!(
            "version {} failed! Failed to parse type {}, with data: {:?}",
            txn_version, event_type, data,
        ))
    }
}

impl GlobalStateEvent {
    pub fn from_event_type(
        event_type: &str,
        data: &str,
        txn_version: i64,
    ) -> Result<Option<GlobalStateEvent>> {
        match EmojicoinTypeTag::from_type_str(event_type) {
            Some(EmojicoinTypeTag::GlobalState) => {
                serde_json::from_str::<GlobalStateEvent>(data).map(Some)
            }
            _ => Ok(None),
        }
        .context(format!(
            "version {} failed! Failed to parse type {}, with data: {:?}",
            txn_version, event_type, data,
        ))
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum BumpEvent {
    MarketRegistration(MarketRegistrationEvent),
    Swap(SwapEvent),
    Chat(ChatEvent),
    Liquidity(LiquidityEvent),
}
// A subset of the transaction info that comes in from the GRPC stream.
#[derive(Debug, Clone)]
pub struct TxnInfo {
    pub block_number: i64,
    pub version: i64,
    pub sender: String,
    pub entry_function: Option<String>,
    pub timestamp: chrono::NaiveDateTime,
}

#[derive(Debug, Clone)]
pub struct EventGroup {
    pub market_id: u64,
    pub market_nonce: u64,
    pub bump_event: BumpEvent,
    pub state_event: StateEvent,
    pub periodic_state_events: Vec<PeriodicStateEvent>,
    pub txn_info: TxnInfo,
}

impl From<BumpEvent> for EventWithMarket {
    fn from(event: BumpEvent) -> Self {
        match event {
            BumpEvent::MarketRegistration(event) => EventWithMarket::MarketRegistration(event),
            BumpEvent::Swap(event) => EventWithMarket::Swap(event),
            BumpEvent::Chat(event) => EventWithMarket::Chat(event),
            BumpEvent::Liquidity(event) => EventWithMarket::Liquidity(event),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MarketResource {
    pub metadata: MarketMetadata,
    pub sequence_info: SequenceInfo,
    pub extend_ref: ExtendRef,
    pub clamm_virtual_reserves: Reserves,
    pub cpamm_real_reserves: Reserves,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub lp_coin_supply: BigDecimal,
    pub cumulative_stats: CumulativeStats,
    pub last_swap: LastSwap,
    pub periodic_state_trackers: Vec<PeriodicStateTracker>,
}
#[derive(Serialize, Deserialize, Debug, Clone)]

pub struct SequenceInfo {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub nonce: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub last_bump_time: BigDecimal,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExtendRef {
    // We need to rename the `self` field because it's a reserved keyword in Rust.
    #[serde(
        deserialize_with = "deserialize_and_standardize_address",
        rename = "self"
    )]
    pub self_address: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PeriodicStateTracker {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub start_time: BigDecimal,
    #[serde(deserialize_with = "deserialize_state_period")]
    #[serde(serialize_with = "serialize_state_period")]
    pub period: Period,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub open_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub high_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub low_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub close_price_q64: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub volume_base: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub volume_quote: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub integrator_fees: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_base: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub pool_fees_quote: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_swaps: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub n_chat_messages: BigDecimal,
    pub starts_in_bonding_curve: bool,
    pub ends_in_bonding_curve: bool,
    pub tvl_to_lp_coin_ratio_start: TVLtoLPCoinRatio,
    pub tvl_to_lp_coin_ratio_end: TVLtoLPCoinRatio,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TVLtoLPCoinRatio {
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub tvl: BigDecimal,
    #[serde(deserialize_with = "deserialize_from_string")]
    #[serde(serialize_with = "serialize_to_string")]
    pub lp_coins: BigDecimal,
}

impl MarketResource {
    pub fn from_write_resource(resource: &WriteResource) -> Result<Option<Self>> {
        let data = &resource.data;
        match EmojicoinTypeTag::from_type_str(&resource.type_str) {
            Some(EmojicoinTypeTag::Market) => serde_json::from_str(data.as_str()).map(Some),
            _ => Ok(None),
        }
        .context(format!(
            "Parsing a MarketResource failed! Failed to parse type {}, with data: {:?}",
            resource.type_str, data,
        ))
    }
}
