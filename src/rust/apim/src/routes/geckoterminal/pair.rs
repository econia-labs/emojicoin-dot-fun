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
    util::{cached_response, default_headers, Response},
};

use super::GeckoTerminalRoute;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PairId {
    id: String,
}

pub async fn pair(
    State(state): State<Arc<AppState>>,
    pair_id: Query<PairId>,
) -> Result<Response, StatusCode> {
    let key = Route::GeckoTerminal(GeckoTerminalRoute::Pair(pair_id.id.clone()));
    if let Some(response) = state.cache().get(&key).await {
        return Ok(cached_response(response, None));
    }
    let Some((address, _)) = pair_id.id.split_once("::") else {
        return Err(StatusCode::NOT_FOUND);
    };
    let result = query_file!("src/routes/geckoterminal/pair.sql", address)
        .fetch_optional(state.pool())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    let result = result.unwrap();
    let timestamp = result.transaction_timestamp.assume_utc().unix_timestamp();
    let result = json!({
        "pair": {
            "id": pair_id.id,
            "dexKey": "emojicoin-dot-fun",
            "asset0Id": pair_id.id,
            "asset1Id": "0x1::aptos_coin::AptosCoin",
            "createdAtBlockNumber": result.block_number,
            "createdAtBlockTimestamp": timestamp,
            "createdAtTxnId": result.transaction_version,
            "feeBps": 0,
            "creator": result.sender,
        }
    })
    .to_string();
    state.cache().insert(key, result.clone()).await;
    Ok((default_headers(), result))
}
