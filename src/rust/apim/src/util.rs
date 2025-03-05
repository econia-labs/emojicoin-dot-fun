use axum::http::{header::CONTENT_TYPE, HeaderMap, HeaderName, HeaderValue};

pub type Response = (HeaderMap, String);

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

/// Return a response along with the x-edf-cached header to let the requester know that the query
/// was cached.
pub fn cached_response(response: String, header_map: Option<HeaderMap>) -> Response {
    let mut header_map = if let Some(header_map) = header_map {
        header_map
    } else {
        default_headers()
    };
    header_map.insert(
        HeaderName::from_static(CACHE_HEADER),
        HeaderValue::from_static("true"),
    );
    (header_map, response)
}
