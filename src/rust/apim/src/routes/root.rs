use std::sync::Arc;

use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
};
use sqlx::query;

use crate::{
    state::AppState,
    util::{cached_response, Response},
};

use super::Route;

/// Get the last success version from the processor.
pub async fn root(State(state): State<Arc<AppState>>) -> Result<Response, StatusCode> {
    let key = Route::Root;
    if let Some(response) = state.cache().get(&key).await {
        return Ok(cached_response(response, None));
    }
    let result = query!("SELECT last_success_version FROM processor_status")
        .fetch_one(state.pool())
        .await
        .map(|e| e.last_success_version.to_string())
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    state.cache().insert(key, result.clone()).await;
    Ok((HeaderMap::new(), result))
}
