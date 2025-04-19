use std::sync::Arc;

use axum::{
    extract::State,
    http::HeaderMap,
};

use crate::{
    state::AppState,
    util::ResponseResult,
};

use super::Route;

use restapi_macro::restapi_cache;

/// Get the version of the RESTAPI crate
#[restapi_cache(Route::Root)]
pub async fn root() -> ResponseResult {
    Ok((HeaderMap::new(), env!("CARGO_PKG_VERSION").to_string()))
}
