use axum::http::{header::CONTENT_TYPE, HeaderMap, HeaderValue, StatusCode};
use tracing::error;

pub type Response = (HeaderMap, String);
pub type Error = (HeaderMap, StatusCode);
pub type ResponseResult = Result<Response, Error>;

pub const CACHE_HEADER: &str = "x-edf-cached";

/// Get default headers.
///
/// ```http
/// Content-Type: application/json
/// ```
pub fn default_headers() -> HeaderMap {
    let mut map = HeaderMap::new();

    map.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    map
}

pub fn with_default_headers<T>(response: T) -> (HeaderMap, T) {
    (default_headers(), response)
}

#[inline]
pub fn map_500<E: std::fmt::Debug>(error: E) -> Error {
    error!("Internal error: {error:?}.");
    with_default_headers(StatusCode::INTERNAL_SERVER_ERROR)
}

pub fn validate_address(address: &str) -> bool {
    regex::Regex::new("^0x[0-9a-f]{64}$").unwrap().is_match(address)
}
