use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
};
use sdk::{consts::{DECIMALS, TOTAL_SUPPLY}, scn::to_emoji_string};
use serde::Deserialize;
use serde_json::json;
use sqlx::query_file;

use crate::{
    routes::Route,
    state::AppState,
    util::{map_500, validate_address, with_default_headers, ResponseResult},
};

use super::GeckoTerminalRoute;

#[derive(Deserialize, Debug, Hash, PartialEq, Eq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AssetId {
    id: String,
}

use restapi_macro::restapi_cache;

#[restapi_cache(Route::GeckoTerminal(GeckoTerminalRoute::Asset(asset_id)))]
pub async fn asset(
    State(state): State<Arc<AppState>>,
    Query(asset_id): Query<AssetId>,
) -> ResponseResult {
    let Some((address, rest)) = asset_id.id.split_once("::") else {
        return Err(with_default_headers(StatusCode::BAD_REQUEST));
    };

    if rest != "::coin_factory::Emojicoin" {
        return Err(with_default_headers(StatusCode::BAD_REQUEST));
    }

    if !validate_address(address) {
        return Err(with_default_headers(StatusCode::BAD_REQUEST));
    }

    let result = query_file!("src/routes/geckoterminal/asset.sql", address)
        .fetch_optional(state.pool())
        .await
        .map_err(map_500)?;

    if result.is_none() {
        return Err(with_default_headers(StatusCode::NOT_FOUND));
    }

    let result = result.unwrap();

    let emojis = to_emoji_string(result.codepoints).unwrap();

    let result = json!({
        "asset": {
            "id": asset_id.id,
            "name": format!("{} emojicoin", emojis),
            "symbol": emojis,
            "totalSupply": TOTAL_SUPPLY,
            "decimals": DECIMALS,
        }
    })
    .to_string();
    let res = with_default_headers(result);
    Ok(res)
}
