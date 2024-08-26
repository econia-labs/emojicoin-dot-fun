use std::sync::Arc;

use axum::{routing::get, Router};
use log::{debug, info, warn};
use processor::emojicoin_dot_fun::EmojicoinDbEvent;
use tokio::sync::broadcast::Sender;

use crate::util::shutdown_signal;

#[cfg(feature = "sse")]
mod sse;
#[cfg(feature = "ws")]
mod ws;

struct AppState {
    #[allow(dead_code)]
    tx: Sender<EmojicoinDbEvent>,
}

#[cfg(all(feature = "sse", not(feature = "ws")))]
fn prepare_app(app: Router<Arc<AppState>>) -> Router<Arc<AppState>> {
    app.route("/sse", get(sse::handler))
}

#[cfg(all(feature = "ws", not(feature = "sse")))]
fn prepare_app(app: Router<Arc<AppState>>) -> Router<Arc<AppState>> {
    app.route("/ws", get(ws::handler))
}

#[cfg(all(feature = "ws", feature = "sse"))]
fn prepare_app(app: Router<Arc<AppState>>) -> Router<Arc<AppState>> {
    app.route("/ws", get(ws::handler))
        .route("/sse", get(sse::handler))
}

#[cfg(all(not(feature = "ws"), not(feature = "sse")))]
fn prepare_app(app: Router<Arc<AppState>>) -> Router<Arc<AppState>> {
    app
}

async fn health() {
    debug!("Health check: healthy");
}

pub async fn server(tx: Sender<EmojicoinDbEvent>, port: u16) -> Result<(), std::io::Error> {
    let app_state = AppState { tx };

    let app = prepare_app(Router::new().route("/", get(health)));
    let app = app.with_state(Arc::new(app_state));

    let listener = tokio::net::TcpListener::bind(&format!("0.0.0.0:{port}"))
        .await
        .unwrap();

    if cfg!(all(feature = "ws", feature = "sse")) {
        info!("Starting web server with ws and sse.");
    }
    if cfg!(all(feature = "ws", not(feature = "sse"))) {
        info!("Starting web server with ws.");
    }
    if cfg!(all(not(feature = "ws"), feature = "sse")) {
        info!("Starting web server with sse.");
    }
    if cfg!(all(not(feature = "ws"), not(feature = "sse"))) {
        warn!("Starting web server with no endpoints.");
    }

    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = shutdown_signal().await;
        })
        .await
}
