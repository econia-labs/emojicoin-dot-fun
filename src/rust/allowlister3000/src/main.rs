use axum::{
    extract::{Path, State},
    http::Method,
    routing::get,
    Router,
};
use std::{collections::HashSet, sync::Arc};
use tower_http::cors::{Any, CorsLayer};

fn sanitize(mut address: String) -> String {
    loop {
        if address == "0x" {
            break String::from("0x0");
        }
        if address.starts_with("0x0") {
            address.remove(2);
        } else {
            break address;
        }
    }
}

async fn allowlist(
    Path(address): Path<String>,
    State(state): State<Arc<HashSet<String>>>,
) -> String {
    if address.len() > 66 || !address.starts_with("0x") {
        false.to_string()
    } else {
        state.contains(&sanitize(address)).to_string()
    }
}

#[tokio::main]
async fn main() {
    let mut set = HashSet::new();
    std::fs::read_to_string(std::env::var("ALLOWLIST_FILE").unwrap())
        .unwrap()
        .lines()
        .map(str::to_string)
        .map(sanitize)
        .for_each(|l| {
            set.insert(l);
        });
    let cors = CorsLayer::new()
        .allow_methods([Method::GET])
        .allow_origin(Any)
        .allow_headers(Any);
    let app = Router::new()
        .route("/:address", get(allowlist))
        .layer(cors)
        .with_state(Arc::new(set));
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
