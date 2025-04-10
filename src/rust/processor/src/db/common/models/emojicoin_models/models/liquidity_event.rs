use crate::{
    db::common::models::emojicoin_models::{
        enums,
        json_types::{LiquidityEvent, StateEvent, TxnInfo},
        parsers::emojis::parser::symbol_bytes_to_emojis,
        utils::micros_to_naive_datetime,
    },
    schema::liquidity_events,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(market_id, market_nonce))]
#[diesel(table_name = liquidity_events)]
pub struct LiquidityEventModel {
    // Transaction metadata.
    pub block_number: i64,
    pub transaction_version: i64,
    pub event_index: i64,
    pub sender: String,
    pub entry_function: Option<String>,
    pub transaction_timestamp: chrono::NaiveDateTime,

    // Market and state metadata.
    pub market_id: BigDecimal,
    pub symbol_bytes: Vec<u8>,
    pub symbol_emojis: Vec<String>,
    pub bump_time: chrono::NaiveDateTime,
    pub market_nonce: BigDecimal,
    pub trigger: enums::Trigger,
    pub market_address: String,

    // Liquidity event data.
    pub provider: String,
    pub base_amount: BigDecimal,
    pub quote_amount: BigDecimal,
    pub lp_coin_amount: BigDecimal,
    pub liquidity_provided: bool,
    pub base_donation_claim_amount: BigDecimal,
    pub quote_donation_claim_amount: BigDecimal,

    // State event data.
    pub clamm_virtual_reserves_base: BigDecimal,
    pub clamm_virtual_reserves_quote: BigDecimal,
    pub cpamm_real_reserves_base: BigDecimal,
    pub cpamm_real_reserves_quote: BigDecimal,
    pub lp_coin_supply: BigDecimal,
    pub cumulative_stats_base_volume: BigDecimal,
    pub cumulative_stats_quote_volume: BigDecimal,
    pub cumulative_stats_integrator_fees: BigDecimal,
    pub cumulative_stats_pool_fees_base: BigDecimal,
    pub cumulative_stats_pool_fees_quote: BigDecimal,
    pub cumulative_stats_n_swaps: BigDecimal,
    pub cumulative_stats_n_chat_messages: BigDecimal,
    pub instantaneous_stats_total_quote_locked: BigDecimal,
    pub instantaneous_stats_total_value_locked: BigDecimal,
    pub instantaneous_stats_market_cap: BigDecimal,
    pub instantaneous_stats_fully_diluted_value: BigDecimal,

    // Last swap data.
    pub last_swap_is_sell: bool,
    pub last_swap_avg_execution_price_q64: BigDecimal,
    pub last_swap_base_volume: BigDecimal,
    pub last_swap_quote_volume: BigDecimal,
    pub last_swap_nonce: BigDecimal,
    pub last_swap_time: chrono::NaiveDateTime,
}

impl LiquidityEventModel {
    pub fn new(
        txn_info: TxnInfo,
        liquidity_event: LiquidityEvent,
        state_event: StateEvent,
    ) -> LiquidityEventModel {
        let StateEvent {
            market_metadata,
            state_metadata,
            clamm_virtual_reserves: clamm,
            cpamm_real_reserves: cpamm,
            lp_coin_supply,
            cumulative_stats: c_stats,
            instantaneous_stats: i_stats,
            last_swap,
            ..
        } = state_event;

        let LiquidityEvent {
            time,
            provider,
            base_amount,
            quote_amount,
            lp_coin_amount,
            liquidity_provided,
            base_donation_claim_amount,
            quote_donation_claim_amount,
            event_index,
            ..
        } = liquidity_event;

        LiquidityEventModel {
            // Transaction metadata.
            block_number: txn_info.block_number,
            transaction_version: txn_info.version,
            event_index,
            sender: txn_info.sender.clone(),
            entry_function: txn_info.entry_function.clone(),
            transaction_timestamp: txn_info.timestamp,

            // Market and state metadata.
            market_id: liquidity_event.market_id,
            symbol_bytes: market_metadata.emoji_bytes.clone(),
            symbol_emojis: symbol_bytes_to_emojis(&market_metadata.emoji_bytes),
            bump_time: micros_to_naive_datetime(&time),
            market_nonce: liquidity_event.market_nonce,
            trigger: state_metadata.trigger,
            market_address: market_metadata.market_address,

            // Liquidity event data.
            provider,
            base_amount,
            quote_amount,
            lp_coin_amount,
            liquidity_provided,
            base_donation_claim_amount,
            quote_donation_claim_amount,

            // State event data.
            clamm_virtual_reserves_base: clamm.base,
            clamm_virtual_reserves_quote: clamm.quote,
            cpamm_real_reserves_base: cpamm.base,
            cpamm_real_reserves_quote: cpamm.quote,
            lp_coin_supply: lp_coin_supply.clone(),
            cumulative_stats_base_volume: c_stats.base_volume,
            cumulative_stats_quote_volume: c_stats.quote_volume,
            cumulative_stats_integrator_fees: c_stats.integrator_fees,
            cumulative_stats_pool_fees_base: c_stats.pool_fees_base,
            cumulative_stats_pool_fees_quote: c_stats.pool_fees_quote,
            cumulative_stats_n_swaps: c_stats.n_swaps,
            cumulative_stats_n_chat_messages: c_stats.n_chat_messages,
            instantaneous_stats_total_quote_locked: i_stats.total_quote_locked,
            instantaneous_stats_total_value_locked: i_stats.total_value_locked,
            instantaneous_stats_market_cap: i_stats.market_cap,
            instantaneous_stats_fully_diluted_value: i_stats.fully_diluted_value,
            last_swap_is_sell: last_swap.is_sell,
            last_swap_avg_execution_price_q64: last_swap.avg_execution_price_q64.clone(),
            last_swap_base_volume: last_swap.base_volume,
            last_swap_quote_volume: last_swap.quote_volume,
            last_swap_nonce: last_swap.nonce,
            last_swap_time: micros_to_naive_datetime(&last_swap.time),
        }
    }
}
