use anyhow::anyhow;
use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::Response,
    routing::get,
    Router,
};
use processor::emojicoin_dot_fun::EmojicoinDbEvent;
use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
};
use tokio::sync::{mpsc::UnboundedReceiver, Mutex, RwLock};
use tracing::{debug, error, info, trace};

struct Connection {
    socket: WebSocket,
    id: u64,
}

struct AppState {
    connections: Mutex<HashMap<u64, Connection>>,
}

async fn health() {}

pub async fn start(
    receiver: Arc<RwLock<UnboundedReceiver<EmojicoinDbEvent>>>,
) -> anyhow::Result<()> {
    let port = std::env::var("WS_PORT");
    let port: u16 = port
        .map_err(|_| anyhow!("Environment variable WS_PORT is not set."))?
        .parse()
        .map_err(|_| anyhow!("Environment variable WS_PORT is not a valid port number."))?;

    let app_state = AppState {
        connections: Mutex::new(HashMap::new()),
    };
    let app_state = Arc::new(app_state);
    let app_state_clone = app_state.clone();
    let app = Router::new()
        .route("/", get(health))
        .route("/ws", get(handler))
        .with_state(app_state);

    let sender_handler = tokio::spawn(async move {
        let app_state = app_state_clone;
        let mut receiver = receiver.write().await;
        while let Some(value) = receiver.recv().await {
            debug!("Got event {value}.");
            let value_string = serde_json::to_string(&value).unwrap();
            let mut to_remove = vec![];
            let mut connections_mut = app_state.connections.lock().await;
            for connection in connections_mut.values_mut() {
                trace!("Sending event to {}", connection.id);
                let res = connection
                    .socket
                    .send(Message::Text(value_string.clone()))
                    .await;
                if res.is_err() {
                    to_remove.push(connection.id);
                }
            }
            for id in to_remove {
                info!("Removing connection with ID {id}.");
                let connection = connections_mut.remove(&id);
                if let Some(connection) = connection {
                    let _ = connection.socket.close().await;
                }
            }
        }
    });

    let server_handle: tokio::task::JoinHandle<anyhow::Result<()>> = tokio::spawn(async move {
        let listener = tokio::net::TcpListener::bind(&format!("0.0.0.0:{port}")).await?;
        info!("Web server started.");
        axum::serve(listener, app).await?;
        info!("Web server stopped.");
        Ok(())
    });

    tokio::select! {
        e = sender_handler => {
            error!(error = ?e, "Sender error.")
        }
        e = server_handle => {
            error!(error = ?e, "Server error")
        }
    };
    Ok(())
}

async fn handler(ws: WebSocketUpgrade, State(state): State<Arc<AppState>>) -> Response {
    ws.on_upgrade(move |socket| handle_websocket(socket, state.clone()))
}

static NEXT_USER_ID: AtomicU64 = AtomicU64::new(0);

async fn handle_websocket(socket: WebSocket, app_state: Arc<AppState>) {
    let user_id = NEXT_USER_ID.fetch_add(1, Ordering::Relaxed);
    info!("New connection with ID {user_id}");
    app_state.connections.lock().await.insert(
        user_id,
        Connection {
            socket,
            id: user_id,
        },
    );
}
