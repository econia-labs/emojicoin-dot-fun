// This file is a partial copy of the Aptos indexer SDK `move_resources.rs`:
// https://github.com/aptos-labs/aptos-indexer-processors-v2/blob/main/processor/src/processors/default/models/move_resources.rs

// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

#![allow(clippy::extra_unused_lifetimes)]

use anyhow::{Context, Result};
use aptos_indexer_processor_sdk::{
    aptos_protos::transaction::v1::{
        DeleteResource, MoveStructTag as MoveStructTagPB, WriteResource,
    },
    utils::convert::standardize_address,
};
use serde::{Deserialize, Serialize};

/**
 * This is the base MoveResource model struct which should be used to build all other extended models such as
 * ParquetMoveResource, PostgresMoveResource, etc.
 * In order for this to work with old code, columns names should be kept the same as the old model.
 */
#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MoveResource {
    pub txn_version: i64,
    pub write_set_change_index: i64,
    pub block_height: i64,
    pub fun: String,
    pub resource_type: String,
    pub resource_address: String,
    pub module: String,
    pub generic_type_params: Option<serde_json::Value>,
    pub data: Option<serde_json::Value>,
    pub is_deleted: bool,
    pub state_key_hash: String,
}

pub struct MoveStructTag {
    resource_address: String,
    pub module: String,
    pub fun: String,
    pub generic_type_params: Option<serde_json::Value>,
}

impl MoveResource {
    pub fn from_write_resource(
        write_resource: &WriteResource,
        write_set_change_index: i64,
        txn_version: i64,
        block_height: i64,
    ) -> Result<Option<Self>> {
        if let Some(move_struct_tag) = write_resource.r#type.as_ref() {
            let parsed_data = Self::convert_move_struct_tag(move_struct_tag);

            let move_resource = Self {
                txn_version,
                block_height,
                write_set_change_index,
                fun: parsed_data.fun.clone(),
                resource_type: write_resource.type_str.clone(),
                resource_address: standardize_address(&write_resource.address.to_string()),
                module: parsed_data.module.clone(),
                generic_type_params: parsed_data.generic_type_params,
                data: serde_json::from_str(write_resource.data.as_str()).ok(),
                is_deleted: false,
                state_key_hash: standardize_address(
                    hex::encode(write_resource.state_key_hash.as_slice()).as_str(),
                ),
            };
            Ok(Some(move_resource))
        } else {
            Err(anyhow::anyhow!(
                "MoveStructTag Does Not Exist for {}",
                txn_version
            ))
        }
    }

    pub fn from_delete_resource(
        delete_resource: &DeleteResource,
        write_set_change_index: i64,
        txn_version: i64,
        block_height: i64,
    ) -> Result<Option<Self>> {
        if let Some(move_struct_tag) = delete_resource.r#type.as_ref() {
            let parsed_data = Self::convert_move_struct_tag(move_struct_tag);

            let move_resource = Self {
                txn_version,
                block_height,
                write_set_change_index,
                fun: parsed_data.fun.clone(),
                resource_type: delete_resource.type_str.clone(),
                resource_address: standardize_address(&delete_resource.address.to_string()),
                module: parsed_data.module.clone(),
                generic_type_params: parsed_data.generic_type_params,
                data: None,
                is_deleted: true,
                state_key_hash: standardize_address(
                    hex::encode(delete_resource.state_key_hash.as_slice()).as_str(),
                ),
            };
            Ok(Some(move_resource))
        } else {
            Err(anyhow::anyhow!(
                "MoveStructTag Does Not Exist for {}",
                txn_version
            ))
        }
    }

    pub fn get_outer_type_from_write_resource(write_resource: &WriteResource) -> String {
        let move_struct_tag =
            Self::convert_move_struct_tag(write_resource.r#type.as_ref().unwrap());

        format!(
            "{}::{}::{}",
            move_struct_tag.get_address(),
            move_struct_tag.module,
            move_struct_tag.fun,
        )
    }

    pub fn get_outer_type_from_delete_resource(delete_resource: &DeleteResource) -> String {
        let move_struct_tag =
            Self::convert_move_struct_tag(delete_resource.r#type.as_ref().unwrap());

        format!(
            "{}::{}::{}",
            move_struct_tag.get_address(),
            move_struct_tag.module,
            move_struct_tag.fun,
        )
    }

    // TODO: Check if this has to be within MoveResource implementation or not
    pub fn convert_move_struct_tag(struct_tag: &MoveStructTagPB) -> MoveStructTag {
        MoveStructTag {
            resource_address: standardize_address(struct_tag.address.as_str()),
            module: struct_tag.module.to_string(),
            fun: struct_tag.name.to_string(),
            generic_type_params: struct_tag
                .generic_type_params
                .iter()
                .map(|move_type| -> Result<Option<serde_json::Value>> {
                    Ok(Some(
                        serde_json::to_value(move_type).context("Failed to parse move type")?,
                    ))
                })
                .collect::<Result<Option<serde_json::Value>>>()
                .unwrap_or(None),
        }
    }
}

impl MoveStructTag {
    pub fn get_address(&self) -> String {
        standardize_address(self.resource_address.as_str())
    }
}
