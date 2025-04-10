use crate::db::common::models::emojicoin_models::json_types::MarketResource;
use aptos_indexer_processor_sdk::{
    aptos_protos::transaction::v1::{write_set_change::Change as WriteSetChangeEnum, Transaction},
    utils::convert::standardize_address,
};

impl MarketResource {
    pub fn from_write_set_changes(txn: &Transaction, market_address: &str) -> Self {
        txn.info
            .as_ref()
            .expect("Transaction info should exist.")
            .changes
            .iter()
            .find_map(|wsc| {
                if let WriteSetChangeEnum::WriteResource(resource) = &wsc.change.as_ref().unwrap() {
                    if standardize_address(resource.address.as_str()) == market_address {
                        Self::from_write_resource(resource).ok().flatten()
                    } else {
                        None
                    }
                } else {
                    None
                }
            })
            .expect("Market resource should exist.")
    }
}
