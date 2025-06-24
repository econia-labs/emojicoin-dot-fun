use aptos_indexer_processor_sdk::utils::convert::standardize_address;
use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDateTime};
use num::ToPrimitive;

use crate::db::common::models::fungible_asset::fungible_asset_models::v2_fungible_asset_balances::{
    get_paired_metadata_address, get_primary_fungible_store_address,
};

pub fn micros_to_naive_datetime(microseconds: &BigDecimal) -> NaiveDateTime {
    // There should be no truncation issues for almost ~300,000 years.
    let micros_i64 = BigDecimal::to_i64(microseconds)
        .expect("Microsecond values should always be representable as an i64.");
    DateTime::from_timestamp_micros(micros_i64)
        .expect("Should be able to convert microseconds to a DateTime and then to a NaiveDateTime.")
        .naive_utc()
}

pub fn within_past_day(time: NaiveDateTime) -> bool {
    let one_day_ago = chrono::Utc::now() - chrono::Duration::hours(24);

    time.and_utc() > one_day_ago
}

// Since we are relying on serialization from within the VM to get derived fungible asset addresses,
// we must use the same serialization functions for addresses.
// In this case, `fungible_asset.move` uses `type_info::type_name`, a native function that you can
// see here: https://github.com/aptos-labs/aptos-core/blob/c6e47d9b896580f3ff63b2a99ae8ea7f9adbdb2d/aptos-move/framework/src/natives/type_info.rs#L95
// This ultimately leads here:
// https://github.com/aptos-labs/aptos-core/blob/c6e47d9b896580f3ff63b2a99ae8ea7f9adbdb2d/third_party/move/move-core/types/src/language_storage.rs#L400
// where struct tags are formatted into a string with `short_str_lossless`.
// Ultimately, `short_str_lossless` simply removes leading zeros and ensures there's a prepended
// `0x` at the beginning of the hex string.
pub fn to_lp_coin_type(market_address: &str) -> String {
    let lossless_address = market_address
        .trim_start_matches("0x")
        .trim_start_matches("0");
    format!("0x{lossless_address}::coin_factory::EmojicoinLP")
}

// Note that `market_address` is standardized to the lossless format in `to_lp_coin_type`.
// `owner_address` is standardized within this function, so neither arguments need to be standard
// representations of addresses; they simply need to be valid address strings.
pub fn to_lp_primary_store_address(market_address: &str, owner_address: &str) -> String {
    let lp_coin_type = &to_lp_coin_type(market_address);
    let metadata_address = get_paired_metadata_address(lp_coin_type);
    let owner_address_standardized = standardize_address(owner_address);
    get_primary_fungible_store_address(
        owner_address_standardized.as_str(),
        metadata_address.as_str(),
    )
    .expect("Should be able to get the primary fungible store address")
}
