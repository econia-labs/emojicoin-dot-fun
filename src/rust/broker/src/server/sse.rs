use std::{convert::Infallible, sync::Arc};

use axum::{
    extract::State,
    response::{
        sse::{Event, KeepAlive},
        Sse,
    },
};
use axum_extra::extract::Query;
use futures_util::{Stream, StreamExt};
use log::{error, info, trace, warn};
use tokio::sync::broadcast::error::RecvError;

use crate::{types::Subscription, util::is_match};

use super::AppState;

/// Handles a request to `/sse`.
///
/// Takes subscription data as query parameters.
///
/// If a field is left empty, you will be subscribed to all.
///
/// Example of connection paths:
///
/// - `/sse?markets=1&event_types=Chat`: subscribe to chat events on market 1
/// - `/sse?markets=1`: subscribe to all events on market 1
/// - `/sse?event_types=State`: subscribe to all State events
/// - `/sse`: subscribe to all events
/// - `/sse?markets=1&markets=2&event_types=Chat&event_types=Swap`: subscribe to Chat and Swap events on markets 1 and 2
pub async fn handler(
    Query(subscription): Query<Subscription>,
    State(state): State<Arc<AppState>>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    info!("New SSE connection ({subscription:?}).");

    let mut rx = state.tx.subscribe();
    let stream = async_stream::stream! {
        loop {
            let mut r = rx.recv().await;
            while matches!(r, Err(RecvError::Lagged(_))) {
                warn!("Messages dropped due to lag.");
                r = rx.recv().await;
            }
            if let Ok(item) = r {
                if is_match(&subscription, &item) {
                    trace!("Event is a match.");
                    yield item;
                } else {
                    trace!("Event is not a match");
                }
            } else {
                error!("Got unexpected error: {}.", r.unwrap_err());
            }
        }
    };

    let stream = stream
        .map(|e| Event::default().data(serde_json::to_string(&e).unwrap()))
        .map(Ok);

    Sse::new(stream).keep_alive(KeepAlive::default())
}
