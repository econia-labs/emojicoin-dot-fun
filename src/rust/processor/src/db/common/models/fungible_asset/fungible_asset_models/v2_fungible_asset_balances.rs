use aptos_indexer_processor_sdk::utils::{
    constants::{APTOS_COIN_TYPE_STR, APT_METADATA_ADDRESS_HEX, APT_METADATA_ADDRESS_RAW},
    convert::{hex_to_raw_bytes, sha3_256, standardize_address},
};

// Copied directly from:
// https://github.com/aptos-labs/aptos-indexer-processors-v2/blob/8f3fca6c057a1b550342b560773021a4865fb2ca/processor/src/processors/fungible_asset/fungible_asset_models/v2_fungible_asset_balances.rs#L90
pub fn get_paired_metadata_address(coin_type_name: &str) -> String {
    if coin_type_name == APTOS_COIN_TYPE_STR {
        APT_METADATA_ADDRESS_HEX.clone()
    } else {
        let mut preimage = APT_METADATA_ADDRESS_RAW.to_vec();
        preimage.extend(coin_type_name.as_bytes());
        preimage.push(0xFE);
        format!("0x{}", hex::encode(sha3_256(&preimage)))
    }
}

// Copied directly from:
// https://github.com/aptos-labs/aptos-indexer-processors-v2/blob/8f3fca6c057a1b550342b560773021a4865fb2ca/processor/src/processors/fungible_asset/fungible_asset_models/v2_fungible_asset_balances.rs#L101
pub fn get_primary_fungible_store_address(
    owner_address: &str,
    metadata_address: &str,
) -> anyhow::Result<String> {
    let mut preimage = hex_to_raw_bytes(owner_address)?;
    preimage.append(&mut hex_to_raw_bytes(metadata_address)?);
    preimage.push(0xFC);
    Ok(standardize_address(&hex::encode(sha3_256(&preimage))))
}
