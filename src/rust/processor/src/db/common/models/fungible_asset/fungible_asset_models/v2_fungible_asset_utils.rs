// Directly/indirectly copied from:
// https://github.com/aptos-labs/aptos-indexer-processors-v2/blob/main/processor/src/processors/fungible_asset/fungible_asset_models/v2_fungible_asset_utils.rs

use aptos_indexer_processor_sdk::{
    aptos_protos::transaction::v1::WriteResource,
    utils::convert::{deserialize_from_string, standardize_address},
};
use bigdecimal::BigDecimal;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ResourceReference {
    inner: String,
}

impl ResourceReference {
    pub fn get_reference_address(&self) -> String {
        standardize_address(&self.inner)
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FungibleAssetStore {
    pub metadata: ResourceReference,
    #[serde(deserialize_with = "deserialize_from_string")]
    pub balance: BigDecimal,
    pub frozen: bool,
}

impl TryFrom<&WriteResource> for FungibleAssetStore {
    type Error = anyhow::Error;

    fn try_from(write_resource: &WriteResource) -> anyhow::Result<Self> {
        serde_json::from_str(write_resource.data.as_str()).map_err(anyhow::Error::msg)
    }
}
