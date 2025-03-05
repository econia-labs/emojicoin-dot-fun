use std::{net::SocketAddr, sync::Arc};

use expiry::RouteExpiryPolicy;
use moka::future::Cache;
use sqlx::postgres::PgPoolOptions;
use state::AppState;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod expiry;
mod layers;
mod routes;
mod state;
mod util;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Turn on logging.
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
                format!(
                    "{}=debug,tower_http=debug,axum::rejection=trace",
                    env!("CARGO_CRATE_NAME")
                )
                .into()
            }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Create cache.
    let expiry = RouteExpiryPolicy;
    let cache = Cache::builder()
        .max_capacity(10_000)
        .expire_after(expiry)
        .build();

    // Create database pool.
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&std::env::var("DATABASE_URL")?)
        .await?;

    // Create state.
    let state = Arc::new(AppState::new(pool, cache));

    // Create router.
    let app = routes::router().with_state(state);

    // Start server
    let listener = tokio::net::TcpListener::bind("0.0.0.0:6666").await.unwrap();
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();

    Ok(())
}
