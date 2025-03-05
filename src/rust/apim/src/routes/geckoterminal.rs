//! GeckoTerminal API implementation.
//!
//! Original spec: https://docs.google.com/document/d/1ufjAJUa6rGO9PBGJGwfBMn-XMk9NE0ow3_iMYrS3drk

use std::{sync::Arc, time::Duration};

use axum::{routing::get, Router};
use governor::middleware::StateInformationMiddleware;
use tower_governor::{
    governor::{GovernorConfig, GovernorConfigBuilder},
    key_extractor::PeerIpKeyExtractor,
    GovernorLayer,
};

use crate::state::AppState;

mod asset;
mod events;
mod latest_block;
mod pair;

pub use asset::asset;
pub use events::events;
pub use latest_block::latest_block;
pub use pair::pair;

/// GeckoTerminal routes.
#[derive(Debug, Hash, PartialEq, Eq)]
pub enum GeckoTerminalRoute {
    Asset(String),
    Events(i64, i64),
    LatestBlock,
    Pair(String),
}

/// GeckoTerminal rate limitting.
///
/// One token every 500ms, 5 tokens max.
pub fn governor_conf() -> GovernorConfig<PeerIpKeyExtractor, StateInformationMiddleware> {
    GovernorConfigBuilder::default()
        .per_millisecond(500)
        .burst_size(5)
        .use_headers()
        .finish()
        .unwrap()
}

/// GeckoTerminal router.
pub fn router() -> Router<Arc<AppState>> {
    let governor_conf = Arc::new(governor_conf());
    let governor_limiter = governor_conf.limiter().clone();

    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(60));
        governor_limiter.retain_recent();
    });

    Router::new()
        .route("/geckoterminal/asset", get(asset))
        .route("/geckoterminal/events", get(events))
        .route("/geckoterminal/latest-block", get(latest_block))
        .route("/geckoterminal/pair", get(pair))
        .layer(GovernorLayer {
            config: governor_conf,
        })
}
