use std::sync::Arc;

use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
};
use futures_util::{SinkExt, StreamExt};
use log::{debug, error, info, warn};
use tokio::sync::{broadcast::error::RecvError, RwLock};

use crate::{types::Subscription, util::is_match};

use super::AppState;

pub async fn handler(ws: WebSocketUpgrade, State(state): State<Arc<AppState>>) -> Response {
    ws.on_upgrade(|socket| handle_websocket(socket, state))
}

async fn handle_websocket(socket: WebSocket, state: Arc<AppState>) {
    info!("New websocket connection.");

    let (ws_tx, mut ws_rx) = socket.split();

    let ws_tx = Arc::new(RwLock::new(ws_tx));
    let ws_tx2 = ws_tx.clone();

    let sub = Arc::new(RwLock::new(None));
    let sub2 = sub.clone();

    let mut rx = state.tx.subscribe();

    let r = async move {
        while let Some(Ok(msg)) = ws_rx.next().await {
            if let Ok(msg) = msg.to_text() {
                let new_sub: Result<Subscription, _> = serde_json::from_str(msg);
                if let Ok(new_sub) = new_sub {
                    debug!("Subscription updated ({new_sub:?}).");
                    *sub2.write().await = Some(new_sub);
                } else {
                    warn!("Got invalid JSON format from client, closing connection.");
                    break;
                }
            } else {
                warn!("Message sent by client is not text, closing connection.");
                break;
            }
        }
        let _ = ws_tx2.write().await.close().await;
        warn!("Connection ended.");
    };

    let t = async move {
        let sub = sub.clone();
        loop {
            let mut r = rx.recv().await;
            while matches!(r, Err(RecvError::Lagged(_))) {
                warn!("Messages dropped due to lag.");
                r = rx.recv().await;
            }
            if let Ok(item) = r {
                let s = sub.read().await;
                if let Some(s) = &*s {
                    if is_match(s, &item) {
                        let item_str = serde_json::to_string(&item).unwrap();
                        if let Err(e) = ws_tx.write().await.send(Message::Text(item_str)).await {
                            warn!("Could not send event to user: {}, closing connection.", e);
                            break;
                        } else {
                            debug!("Sent message.")
                        }
                    }
                }
            } else {
                error!("Got unexpected error: {}.", r.unwrap_err());
                break;
            }
        }
        let _ = ws_tx.write().await.close().await;
    };

    tokio::select! {
        _ = t => {}
        _ = r => {}
    };

    info!("Websocket connection closed.");
}
