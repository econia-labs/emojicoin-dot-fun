use std::sync::Arc;

use axum::extract::State;
use chrono::{DateTime, Utc};
use serde_json::json;
use sqlx::query_file;

use crate::{
    routes::Route,
    state::AppState,
    util::{map_500, with_default_headers, ResponseResult},
};

use super::GeckoTerminalRoute;

use restapi_macro::restapi_cache;

#[restapi_cache(Route::GeckoTerminal(GeckoTerminalRoute::LatestBlock))]
pub async fn latest_block(State(state): State<Arc<AppState>>) -> ResponseResult {
    let result = query_file!("src/routes/geckoterminal/latest_block.sql")
        .fetch_optional(state.pool())
        .await
        .map_err(map_500)?;

    if result.is_none() {
        let timestamp = DateTime::<Utc>::MIN_UTC.timestamp();
        let result = json!({
            "block": {
                "blockNumber": 0,
                "blockTimestamp": timestamp,
            }
        })
        .to_string();
        return Ok(with_default_headers(result));
    }

    let result = result.unwrap();
    let timestamp = result
        .timestamp
        .signed_duration_since(chrono::DateTime::UNIX_EPOCH)
        .num_seconds();
    let result = json!({
        "block": {
            "blockNumber": result.block,
            "blockTimestamp": timestamp,
        }
    })
    .to_string();
    Ok(with_default_headers(result))
}
