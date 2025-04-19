//! Logging layer.
//!
//! Will log all incoming requests, along with their method and path.
//!
//! Will log latency and cache status on response.

use std::time::Duration;

use axum::{
    body::{Body, Bytes},
    http::{HeaderMap, Request},
    response::Response,
};
use tower_http::{
    classify::{ServerErrorsAsFailures, ServerErrorsFailureClass, SharedClassifier},
    trace::{MakeSpan, OnBodyChunk, OnEos, OnFailure, OnRequest, OnResponse, TraceLayer},
};
use tracing::{error, info, info_span, Span};

use crate::util::CACHE_HEADER;

pub fn layer() -> TraceLayer<
    SharedClassifier<ServerErrorsAsFailures>,
    impl MakeSpan<Body> + Clone,
    impl OnRequest<Body> + Clone,
    impl OnResponse<Body> + Clone,
    impl OnBodyChunk<Bytes> + Clone,
    impl OnEos + Clone,
    impl OnFailure<ServerErrorsFailureClass> + Clone,
> {
    TraceLayer::new_for_http()
        .make_span_with(|request: &Request<Body>| {
            info_span!(
                "http_request",
                method = ?request.method(),
                path = ?request.uri().to_string(),
            )
        })
        .on_request(|_request: &Request<Body>, _span: &Span| {})
        .on_response(|response: &Response, latency: Duration, _span: &Span| {
            let cached = response
                .headers()
                .get(CACHE_HEADER)
                .is_some_and(|v| v == "true");
            info!(?latency, cached);
        })
        .on_body_chunk(|_chunk: &Bytes, _latency: Duration, _span: &Span| {})
        .on_eos(|_trailers: Option<&HeaderMap>, _stream_duration: Duration, _span: &Span| {})
        .on_failure(
            |error: ServerErrorsFailureClass, _latency: Duration, _span: &Span| {
                error!(?error);
            },
        )
}
