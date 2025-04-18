use std::{net::SocketAddr, sync::Arc};

use clap::Parser;
use cli::Args;
use expiry::RouteExpiryPolicy;
use moka::future::Cache;
use sqlx::postgres::PgPoolOptions;
use state::AppState;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod cli;
mod expiry;
mod layers;
mod routes;
mod state;
mod util;

extern crate restapi_macro;

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

    let args = Args::parse();

    // Create cache.
    let expiry = RouteExpiryPolicy;
    let cache = Cache::builder()
        .max_capacity(args.cache_size)
        .expire_after(expiry)
        .build();

    // Create database pool.
    let pool = PgPoolOptions::new()
        .max_connections(args.max_db_connections)
        .connect(&args.database_url)
        .await?;

    // Create state.
    let state = Arc::new(AppState::new(pool, cache));

    // Create router.
    let app = routes::router().with_state(state);

    // Start server
    let listener = tokio::net::TcpListener::bind(SocketAddr::new(args.ip, args.port)).await.unwrap();
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();

    Ok(())
}
