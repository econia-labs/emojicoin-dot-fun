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
pub struct AssetId {
    id: String,
}

pub async fn asset(
    State(state): State<Arc<AppState>>,
    asset_id: Query<AssetId>,
) -> Result<Response, StatusCode> {
    let key = Route::GeckoTerminal(GeckoTerminalRoute::Asset(asset_id.id.clone()));
    if let Some(response) = state.cache().get(&key).await {
        return Ok(cached_response(response, None));
    }
    let Some((address, _)) = asset_id.id.split_once("::") else {
        return Err(StatusCode::NOT_FOUND);
    };
    let result = query_file!("src/routes/geckoterminal/asset.sql", address)
        .fetch_optional(state.pool())
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if result.is_none() {
        return Err(StatusCode::NOT_FOUND);
    }

    let result = result.unwrap();
    let result = json!({
        "asset": {
            "id": asset_id.id,
            "name": format!("{} emojicoin", result.symbol_emojis.join("")),
            "symbol": result.symbol_emojis.join(""),
            "decimals": 8,
        }
    })
    .to_string();
    state.cache().insert(key, result.clone()).await;
    Ok((default_headers(), result))
}
