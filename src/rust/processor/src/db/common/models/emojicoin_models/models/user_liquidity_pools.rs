use super::liquidity_event::LiquidityEventModel;
use crate::{
    db::common::models::{
        emojicoin_models::{
            enums,
            parsers::emojis::parser::symbol_bytes_to_emojis,
            utils::{to_lp_coin_type, to_lp_primary_store_address},
        },
        fungible_asset::{
            coin_models::coin_utils::{CoinInfoType, CoinResource},
            fungible_asset_models::v2_fungible_asset_utils::FungibleAssetStore,
        },
    },
    schema::user_liquidity_pools,
};
use aptos_indexer_processor_sdk::{
    aptos_protos::transaction::v1::{write_set_change::Change, Transaction, WriteResource},
    utils::convert::standardize_address,
};
use bigdecimal::BigDecimal;
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

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

fn get_lp_coin_balance(
    write_resource: &WriteResource,
    txn_version: i64,
    wsc_index: i64,
    lp_coin_type: &str,
) -> Option<BigDecimal> {
    CoinResource::from_write_resource(write_resource, txn_version)
        .ok()
        .flatten()
        .and_then(|resource| match resource {
            CoinResource::CoinStoreResource(store) => CoinInfoType::from_move_type(
                &write_resource.r#type.as_ref().unwrap().generic_type_params[0],
                write_resource.type_str.as_ref(),
                txn_version,
                wsc_index,
            )
            .get_coin_type_below_max()
            .and_then(|coin_type| {
                if coin_type == lp_coin_type {
                    Some(store.coin.value)
                } else {
                    None
                }
            }),
            _ => None,
        })
}

fn get_lp_fungible_asset_balance(
    write_resource: &WriteResource,
    lp_primary_store_address: &str,
) -> Option<BigDecimal> {
    FungibleAssetStore::try_from(write_resource)
        .ok()
        .and_then(|resource| {
            if standardize_address(write_resource.address.as_str()) == lp_primary_store_address {
                Some(resource.balance)
            } else {
                None
            }
        })
}

impl UserLiquidityPoolsModel {
    pub fn from_event_and_writeset(txn: &Transaction, evt: LiquidityEventModel) -> Self {
        let lp_coin_type = to_lp_coin_type(&evt.market_address);
        let lp_primary_store_address =
            to_lp_primary_store_address(&evt.market_address, &evt.provider);
        txn.info
            .as_ref()
            .expect("Transaction info should exist.")
            .changes
            .iter()
            .enumerate()
            .find_map(|(wsc_index, wsc)| {
                if let Change::WriteResource(write_resource) = &wsc.change.as_ref().unwrap() {
                    let txn_version = txn.version as i64;
                    get_lp_fungible_asset_balance(write_resource, lp_primary_store_address.as_str())
                        .or_else(|| {
                            get_lp_coin_balance(
                                write_resource,
                                txn_version,
                                wsc_index as i64,
                                lp_coin_type.as_str(),
                            )
                        })
                        .map(|lp_coin_balance| UserLiquidityPoolsModel {
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
                            lp_coin_balance,
                            market_address: evt.market_address.clone(),
                        })
                } else {
                    None
                }
            })
            .expect("LP coin/FA balance change should be in the writeset.")
    }
}
