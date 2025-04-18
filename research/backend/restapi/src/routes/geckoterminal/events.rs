use std::sync::Arc;

use restapi_macro::restapi_cache;
use axum::extract::{Query, State};
use bigdecimal::{BigDecimal, Zero};
use serde::Deserialize;
use serde_json::json;
use sqlx::query_file;

use crate::{
    routes::Route,
    state::AppState,
    util::{map_500, with_default_headers, ResponseResult},
};

use super::GeckoTerminalRoute;

#[derive(Clone, Debug, Deserialize, Hash, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Blocks {
    from_block: i64,
    to_block: i64,
}

#[restapi_cache(Route::GeckoTerminal(GeckoTerminalRoute::Events(blocks)))]
pub async fn events(
    State(state): State<Arc<AppState>>,
    Query(blocks): Query<Blocks>,
) -> ResponseResult {
    let result = query_file!(
        "src/routes/geckoterminal/events.sql",
        BigDecimal::from(blocks.from_block),
        BigDecimal::from(blocks.to_block)
    )
    .fetch_all(state.pool())
    .await
    .map_err(map_500)?;

    let result: Vec<_> = result.into_iter().map(|r| {
        let timestamp = r.transaction_timestamp.signed_duration_since(chrono::DateTime::UNIX_EPOCH).num_seconds();
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
                "priceNative": r.average_price.round(50),
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

    Ok(with_default_headers(result))
}
