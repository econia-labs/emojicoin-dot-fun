use std::sync::Arc;

use axum::{routing::get, Router};
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

async fn health() {}

pub async fn server(tx: Sender<EmojicoinDbEvent>) -> Result<(), std::io::Error> {
    let app_state = AppState { tx };

    let app = prepare_app(Router::new().route("/", get(health)));
    let app = app.with_state(Arc::new(app_state));

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3009").await.unwrap();
    axum::serve(listener, app)
        .with_graceful_shutdown(async {
            let _ = shutdown_signal().await;
        })
        .await
}
