use std::sync::Arc;

use axum::{extract::{ws::{Message, WebSocket}, State, WebSocketUpgrade}, response::Response};
use futures_util::{SinkExt, StreamExt};
use tokio::sync::{broadcast::error::RecvError, RwLock};

use crate::{types::Subscription, util::is_match};

use super::AppState;

pub async fn handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

async fn handle_websocket(socket: WebSocket, state: Arc<AppState>) {
    log::info!("New websocket connection.");

    let (ws_tx, mut ws_rx) = socket.split();

    let ws_tx = Arc::new(RwLock::new(ws_tx));
    let ws_tx2 = ws_tx.clone();

    let sub = Arc::new(RwLock::new(None));
    let sub2 = sub.clone();

    let mut rx = state.tx.subscribe();

    let r = async move {
        while let Some(Ok(msg)) = ws_rx.next().await {
            if let Ok(msg) = msg.to_text() {
                log::info!("Got message ({}).", msg);
                let new_sub: Result<Subscription, _> = serde_json::from_str(msg);
                if let Ok(new_sub) = new_sub {
                    log::info!("Subscription updated ({new_sub:?}).");
                    *sub2.write().await = Some(new_sub);
                } else {
                    log::warn!("Got invalid JSON format from client, closing.");
                    break;
                }
            } else {
                log::warn!("Message sent by client is not text, closing.");
                break;
            }
        }
        let _ = ws_tx2.write().await.close().await;
        log::warn!("Connection ended, closing.");
    };

    let t = async move {
        let sub = sub.clone();
        loop {
            let mut r = rx.recv().await;
            while matches!(r, Err(RecvError::Lagged(_))) {
                log::warn!("Messages dropped due to lag.");
                r = rx.recv().await;
            }
            if let Ok(item) = r {
                let s = sub.read().await;
                for s in s.iter() {
                    if is_match(&s, &item) {
                        let item_str = serde_json::to_string(&item).unwrap();
                        if let Err(e) = ws_tx.write().await.send(Message::Text(item_str)).await {
                            log::warn!("Could not send event to user: {}.", e);
                            break;
                        } else {
                            log::info!("Sent message.")
                        }
                    }
                }
            } else {
                log::error!("Got error: {}.", r.unwrap_err());
                break;
            }
        }
        let _ = ws_tx.write().await.close().await;
    };

    tokio::select! {
        _ = t => {
            log::warn!("Connection broken (t).")
        }
        _ = r => {
            log::warn!("Connection broken (r).")
        }
    };

    log::info!("Websocket connection closed.");
}
