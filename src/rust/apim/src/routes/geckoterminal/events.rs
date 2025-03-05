use std::sync::Arc;

use axum::{
    extract::{Query, State},
    http::StatusCode,
};
use bigdecimal::Zero;
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
pub struct Blocks {
    from_block: i64,
    to_block: i64,
}

pub async fn events(
    State(state): State<Arc<AppState>>,
    blocks: Query<Blocks>,
) -> Result<Response, StatusCode> {
    let key = Route::GeckoTerminal(GeckoTerminalRoute::Events(
        blocks.from_block,
        blocks.to_block,
    ));
    if let Some(response) = state.cache().get(&key).await {
        return Ok(cached_response(response, None));
    }
    let result = query_file!(
        "src/routes/geckoterminal/events.sql",
        blocks.from_block,
        blocks.to_block
    )
    .fetch_all(state.pool())
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let result: Vec<_> = result.into_iter().map(|r| {
        let timestamp = r.transaction_timestamp.assume_utc().unix_timestamp();
        if r.event_type == "swap" {
            let mut v = json!({
                "block": {
                    "blockNumber": r.block_number,
                    "blockTimestamp": timestamp,
                },
                "eventType": r.event_type,
                "txnId": r.transaction_version,
                "txnIndex": r.transaction_version,
                "eventIndex": r.event_index,
                "maker": r.sender,
                "pairId": format!("{}::coin_factory::Emojicoin", r.market_address),
                "priceNative": (r.avg_execution_price_q64 / 2u128.pow(64)).round(50),
                "reserves": {
                    "asset0": if r.lp_coin_supply.is_zero() { r.clamm_virtual_reserves_base } else { r.cpamm_real_reserves_base },
                    "asset1": if r.lp_coin_supply.is_zero() { r.clamm_virtual_reserves_quote } else { r.cpamm_real_reserves_quote },
                }
            });
            if r.is_sell {
                v.as_object_mut().unwrap().insert("asset0In".to_string(), serde_json::Value::String(r.input_amount.to_string()));
                v.as_object_mut().unwrap().insert("asset1Out".to_string(), serde_json::Value::String(r.net_proceeds.to_string()));
            } else {
                v.as_object_mut().unwrap().insert("asset1In".to_string(), serde_json::Value::String(r.input_amount.to_string()));
                v.as_object_mut().unwrap().insert("asset0Out".to_string(), serde_json::Value::String(r.net_proceeds.to_string()));
            };
            v
        } else {
            json!({
                "eventType": r.event_type,
                "txnId": r.transaction_version,
                "txnIndex": r.transaction_version,
                "eventIndex": r.event_index,
                "maker": r.sender,
                "pairId": format!("{}::coin_factory::Emojicoin", r.market_address),
                "amount0": r.base_amount,
                "amount1": r.quote_amount,
                "reserves": {
                    "asset0": if r.lp_coin_supply.is_zero() { r.clamm_virtual_reserves_base } else { r.cpamm_real_reserves_base },
                    "asset1": if r.lp_coin_supply.is_zero() { r.clamm_virtual_reserves_quote } else { r.cpamm_real_reserves_quote },
                }
            })
        }
    }).collect();

    let result = json!({
        "events": result,
    });

    let result = serde_json::to_string(&result).unwrap();

    state.cache().insert(key, result.clone()).await;
    Ok((default_headers(), result))
}
