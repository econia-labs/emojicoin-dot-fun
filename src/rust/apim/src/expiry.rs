//! Set per route expiry policies.

use std::time::{Duration, Instant};

use moka::Expiry;

use crate::routes::{geckoterminal::GeckoTerminalRoute, Route};

pub struct RouteExpiryPolicy;

impl Expiry<Route, String> for RouteExpiryPolicy {
    fn expire_after_create(
        &self,
        key: &Route,
        _value: &String,
        _current_time: Instant,
    ) -> Option<Duration> {
        let duration_ms = match key {
            Route::Root => Some(500),
            Route::GeckoTerminal(route) => match route {
                GeckoTerminalRoute::LatestBlock => Some(0),
                GeckoTerminalRoute::Asset(_) => Some(1000),
                GeckoTerminalRoute::Pair(_) => None,
                GeckoTerminalRoute::Events(_, _) => Some(0),
            },
        };
        duration_ms.map(Duration::from_millis)
    }
}
