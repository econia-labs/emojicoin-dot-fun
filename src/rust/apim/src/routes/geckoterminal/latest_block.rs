use std::sync::Arc;

use axum::{extract::State, http::StatusCode};
use chrono::{DateTime, Utc};
use serde_json::json;
use sqlx::query_file;

use crate::{
    routes::Route,
    state::AppState,
    util::{cached_response, default_headers, Response},
};

use super::GeckoTerminalRoute;

pub async fn latest_block(State(state): State<Arc<AppState>>) -> Result<Response, StatusCode> {
    let key = Route::GeckoTerminal(GeckoTerminalRoute::LatestBlock);
    if let Some(response) = state.cache().get(&key).await {
        return Ok(cached_response(response, None));
    }
    let result = query_file!("src/routes/geckoterminal/latest_block.sql")
        .fetch_optional(state.pool())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.is_none() {
        let timestamp = DateTime::<Utc>::MIN_UTC.timestamp();
        let result = json!({
            "block": {
                "blockNumber": 0,
                "blockTimestamp": timestamp,
            }
        })
        .to_string();
        state.cache().insert(key, result.clone()).await;
        return Ok((default_headers(), result));
    }

    let result = result.unwrap();
    let timestamp = result
        .transaction_timestamp
        .unwrap()
        .assume_utc()
        .unix_timestamp();
    let result = json!({
        "block": {
            "blockNumber": result.block_number.unwrap(),
            "blockTimestamp": timestamp,
        }
    })
    .to_string();
    state.cache().insert(key, result.clone()).await;
    Ok((default_headers(), result))
}
