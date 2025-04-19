//! Set per route expiry policies.

use std::time::{Duration, Instant};

use moka::Expiry;

use crate::{routes::{geckoterminal::GeckoTerminalRoute, Route}, util::ResponseResult};

pub struct RouteExpiryPolicy;

impl Expiry<Route, ResponseResult> for RouteExpiryPolicy {
    fn expire_after_create(
        &self,
        key: &Route,
        value: &ResponseResult,
        _current_time: Instant,
    ) -> Option<Duration> {
        let duration_ms = if let Err((_, code)) = value {
            match code.as_u16() {
                // Do not cache bad requests.
                400 => Some(0),
                // Cache not found errors for half a second.
                //
                // This prevents people from spamming an endpoint with a parameter that points to
                // an entity that does not exist.
                404 => Some(500),
                // Cache server errors for a second.
                //
                // We do not want to spam the server with errors, so we put a long cache time on
                // server errors.
                500 => Some(1000),
                // Cache every other error for 200ms.
                _ => Some(200),
            }
        } else {
            match key {
                Route::Root => Some(500),
                Route::GeckoTerminal(route) => match route {
                    GeckoTerminalRoute::LatestBlock => Some(0),
                    GeckoTerminalRoute::Asset(_) => Some(1000),
                    GeckoTerminalRoute::Pair(_) => None,
                    GeckoTerminalRoute::Events(_) => Some(0),
                },
            }
        };
        duration_ms.map(Duration::from_millis)
    }
}
