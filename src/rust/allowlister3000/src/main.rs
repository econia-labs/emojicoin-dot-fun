// cspell:word pkill
// cspell:word sigusr
use axum::{
    extract::{Path, State},
    http::Method,
    routing::get,
    Router,
};
use futures::stream::StreamExt;
use signal_hook::consts::SIGUSR1;
use signal_hook_tokio::Signals;
use std::{collections::HashSet, sync::Arc};
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};

// The index of the first piece of actual data in a hex address.
const FIRST_HEX_CHAR: usize = 2;

// The maximum length of a hex address (0x + 64 chars).
const MAX_ADDRESS_LENGTH: usize = 66;

fn sanitize(mut address: String) -> String {
    loop {
        if address == "0x" {
            break String::from("0x0");
        }
        if address.starts_with("0x0") {
            address.remove(FIRST_HEX_CHAR);
        } else {
            break address;
        }
    }
}

async fn allowlist(
    Path(address): Path<String>,
    State(state): State<Arc<RwLock<HashSet<String>>>>,
) -> String {
    if address.len() > MAX_ADDRESS_LENGTH || !address.starts_with("0x") {
        false.to_string()
    } else {
        state.read().await.contains(&sanitize(address)).to_string()
    }
}

fn read_allowlist() -> HashSet<String> {
    std::fs::read_to_string(std::env::var("ALLOWLIST_FILE").unwrap())
        .unwrap()
        .lines()
        .map(str::to_string)
        .map(sanitize)
        .collect()
}

async fn handle_signals(mut signals: Signals, allowlist_set: Arc<RwLock<HashSet<String>>>) {
    while let Some(signal) = signals.next().await {
        match signal {
            SIGUSR1 => {
                *allowlist_set.write().await = read_allowlist();
            }
            _ => unreachable!(),
        }
    }
}

#[tokio::main]
async fn main() {
    let set = Arc::new(RwLock::new(read_allowlist()));
    let signals = Signals::new([SIGUSR1]).unwrap();
    let handle = signals.handle();
    let signals_task = tokio::spawn(handle_signals(signals, set.clone()));
    let cors = CorsLayer::new()
        .allow_methods([Method::GET])
        .allow_origin(Any)
        .allow_headers(Any);
    let app = Router::new()
        .route("/:address", get(allowlist))
        .layer(cors)
        .with_state(set);
    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
    signals_task.await.unwrap();
    handle.close();
}

#[cfg(test)]
mod test {
    use crate::sanitize;

    #[test]
    fn test_sanitize() {
        assert_eq!("0x1", sanitize(String::from("0x1")));
        assert_eq!("0x1", sanitize(String::from("0x01")));
        assert_eq!("0x1", sanitize(String::from("0x0000000001")));
        assert_eq!("0x0", sanitize(String::from("0x0")));
        assert_eq!("0x0", sanitize(String::from("0x00")));
        assert_eq!(
            "0x0",
            sanitize(String::from("0x000000000000000000000000000"))
        );
        assert_eq!(
            "0xfc63b2498d85356f03b68820e78e65633b2fd0a71ca98db79e50ce2ebc1877",
            sanitize(String::from(
                "0x00fc63b2498d85356f03b68820e78e65633b2fd0a71ca98db79e50ce2ebc1877"
            ))
        );
    }
}
