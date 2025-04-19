use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
};
use serde::Deserialize;
use serde_json::json;
use sqlx::query_file;

use crate::{
    routes::Route,
    state::AppState,
    util::{map_500, with_default_headers, ResponseResult},
};

use super::GeckoTerminalRoute;

#[derive(Deserialize, Debug, Hash, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PairId {
    id: String,
}

use restapi_macro::restapi_cache;

#[restapi_cache(Route::GeckoTerminal(GeckoTerminalRoute::Pair(pair_id)))]
pub async fn pair(
    State(state): State<Arc<AppState>>,
    Query(pair_id): Query<PairId>,
) -> ResponseResult {
    let Some((address, _)) = pair_id.id.split_once("::") else {
        return Err(with_default_headers(StatusCode::BAD_REQUEST));
    };
    let result = query_file!("src/routes/geckoterminal/pair.sql", address)
        .fetch_optional(state.pool())
        .await
        .map_err(map_500)?;

    if result.is_none() {
        return Err(with_default_headers(StatusCode::NOT_FOUND));
    }

    let result = result.unwrap();
    let timestamp = result.creation_timestamp
        .signed_duration_since(chrono::DateTime::UNIX_EPOCH)
        .num_seconds();
    let result = json!({
        "pair": {
            "id": pair_id.id,
            "dexKey": "emojicoin-dot-fun",
            "asset0Id": pair_id.id,
            "asset1Id": "0x1::aptos_coin::AptosCoin",
            "createdAtBlockNumber": result.creation_block,
            "createdAtBlockTimestamp": timestamp,
            "createdAtTxnId": result.creation_transaction,
            "feeBps": 0,
            "creator": result.creator,
        }
    })
    .to_string();
    Ok(with_default_headers(result))
}
