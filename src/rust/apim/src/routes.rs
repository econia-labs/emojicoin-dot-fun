use std::{sync::Arc, time::Duration};

use axum::{routing::get, Router};
use geckoterminal::GeckoTerminalRoute;
use governor::middleware::StateInformationMiddleware;
use tower_governor::{
    governor::{GovernorConfig, GovernorConfigBuilder},
    key_extractor::PeerIpKeyExtractor,
    GovernorLayer,
};

use crate::{layers, state::AppState};

pub mod geckoterminal;
pub mod root;

/// Global routes.
#[derive(Debug, Hash, PartialEq, Eq)]
pub enum Route {
    Root,
    GeckoTerminal(GeckoTerminalRoute),
}

/// Default rate limitting.
///
/// One token every second, 5 tokens max.
pub fn governor_conf() -> GovernorConfig<PeerIpKeyExtractor, StateInformationMiddleware> {
    GovernorConfigBuilder::default()
        .per_second(1)
        .burst_size(5)
        .use_headers()
        .finish()
        .unwrap()
}

/// Global router.
pub fn router() -> Router<Arc<AppState>> {
    let governor_conf = Arc::new(governor_conf());
    let governor_limiter = governor_conf.limiter().clone();

    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_secs(60));
        governor_limiter.retain_recent();
    });

    let main = Router::new()
        .route("/", get(root::root))
        .layer(GovernorLayer {
            config: governor_conf,
        });

    Router::new()
        .merge(main)
        .merge(geckoterminal::router())
        .layer(layers::log::layer())
}
