use super::liquidity_event::LiquidityEventModel;
use crate::{
    db::common::models::emojicoin_models::{
        enums, parsers::emojis::parser::symbol_bytes_to_emojis,
    },
    schema::user_liquidity_pools,
};
use aptos_indexer_processor_sdk::{
    aptos_protos::transaction::v1::{write_set_change::Change, Transaction},
    utils::convert::standardize_address,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};

static ADDRESSES_REGEX: Lazy<Regex> = Lazy::new(|| {
    Regex::new("^0x0*1::coin::CoinStore<(0x[^:]*)::coin_factory::EmojicoinLP>$").unwrap()
});

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(provider, market_nonce))]
#[diesel(table_name = user_liquidity_pools)]
pub struct UserLiquidityPoolsModel {
    pub provider: String,
    pub transaction_version: i64,
    pub transaction_timestamp: chrono::NaiveDateTime,

    // Market and state metadata.
    pub market_id: BigDecimal,
    pub symbol_bytes: Vec<u8>,
    pub symbol_emojis: Vec<String>,
    pub bump_time: chrono::NaiveDateTime,
    pub market_nonce: BigDecimal,
    pub trigger: enums::Trigger,
    pub market_address: String,

    pub base_amount: BigDecimal,
    pub quote_amount: BigDecimal,
    pub lp_coin_amount: BigDecimal,
    pub liquidity_provided: bool,
    pub base_donation_claim_amount: BigDecimal,
    pub quote_donation_claim_amount: BigDecimal,

    pub lp_coin_balance: BigDecimal,
}

impl UserLiquidityPoolsModel {
    pub fn from_event_and_writeset(
        txn: &Transaction,
        evt: LiquidityEventModel,
        market_address: &str,
    ) -> Self {
        txn.info
            .as_ref()
            .expect("Transaction info should exist.")
            .changes
            .iter()
            .find_map(|wsc| {
                if let Change::WriteResource(write) = &wsc.change.as_ref().unwrap() {
                    if !ADDRESSES_REGEX.is_match(&write.type_str) {
                        return None;
                    }
                    let caps = ADDRESSES_REGEX.captures(&write.type_str)?;
                    if standardize_address(&caps[1]) == standardize_address(market_address) {
                        let Ok(data) = serde_json::from_str::<serde_json::Value>(&write.data)
                        else {
                            return None;
                        };
                        let amount = data["coin"]["value"].as_str()?;
                        Some(UserLiquidityPoolsModel {
                            provider: evt.provider.clone(),
                            transaction_version: evt.transaction_version,
                            transaction_timestamp: evt.transaction_timestamp,
                            market_id: evt.market_id.clone(),
                            symbol_bytes: evt.symbol_bytes.clone(),
                            symbol_emojis: symbol_bytes_to_emojis(&evt.symbol_bytes),
                            bump_time: evt.bump_time,
                            market_nonce: evt.market_nonce.clone(),
                            trigger: evt.trigger,
                            base_amount: evt.base_amount.clone(),
                            quote_amount: evt.quote_amount.clone(),
                            lp_coin_amount: evt.lp_coin_amount.clone(),
                            liquidity_provided: evt.liquidity_provided,
                            base_donation_claim_amount: evt.base_donation_claim_amount.clone(),
                            quote_donation_claim_amount: evt.quote_donation_claim_amount.clone(),
                            lp_coin_balance: amount.parse().unwrap(),
                            market_address: evt.market_address.clone(),
                        })
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .expect("LP coin change should exist.")
    }
}
