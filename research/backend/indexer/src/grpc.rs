use anyhow::{anyhow, bail};
use aptos_protos::{
    indexer::v1::{GetTransactionsRequest, TransactionsResponse, raw_data_client::RawDataClient},
    transaction::v1::Transaction,
};
use futures_util::StreamExt;
use itertools::Itertools;
use std::time::Duration;
use tokio::{sync::mpsc, time::timeout};
use tonic::{Response, Streaming};
use tracing::{debug, info};
use url::Url;

const GRPC_API_GATEWAY_API_KEY_HEADER: &str = "authorization";
const GRPC_REQUEST_NAME_HEADER: &str = "x-aptos-request-name";
const RECONNECTION_MAX_RETRIES: u64 = 10;
const MAX_RESPONSE_SIZE: usize = 1024 * 1024 * 256;
const INDEXER_GRPC_HTTP2_PING_INTERVAL: Duration = Duration::from_secs(1);
const INDEXER_GRPC_HTTP2_PING_TIMEOUT: Duration = Duration::from_secs(3);
const INDEXER_GRPC_RECONNECTION_TIMEOUT_SECS: Duration = Duration::from_secs(3);
const INDEXER_GRPC_RESPONSE_ITEM_TIMEOUT_SECS: Duration = Duration::from_secs(3);
const CHANNEL_TXN_CHUNK_SIZE: usize = 1024;

pub fn grpc_request_builder(
    starting_version: u64,
    transactions_count: Option<u64>,
    grpc_auth_token: String,
) -> tonic::Request<GetTransactionsRequest> {
    let mut request = tonic::Request::new(GetTransactionsRequest {
        starting_version: Some(starting_version),
        transactions_count,
        ..GetTransactionsRequest::default()
    });
    request.metadata_mut().insert(
        GRPC_API_GATEWAY_API_KEY_HEADER,
        format!("Bearer {}", grpc_auth_token.clone())
            .parse()
            .unwrap(),
    );
    request
        .metadata_mut()
        .insert(GRPC_REQUEST_NAME_HEADER, "processor".parse().unwrap());
    request
}

pub async fn get_stream(
    indexer_grpc_data_service_address: Url,
    starting_version: u64,
    ending_version: Option<u64>,
    auth_token: String,
) -> anyhow::Result<Response<Streaming<TransactionsResponse>>> {
    let channel =
        tonic::transport::Channel::from_shared(indexer_grpc_data_service_address.to_string())?
            .http2_keep_alive_interval(INDEXER_GRPC_HTTP2_PING_INTERVAL)
            .keep_alive_timeout(INDEXER_GRPC_HTTP2_PING_TIMEOUT);

    let channel = if indexer_grpc_data_service_address.scheme() == "https" {
        let config = tonic::transport::channel::ClientTlsConfig::new();
        channel.tls_config(config)?
    } else {
        channel
    };

    let connect_res = timeout(
        INDEXER_GRPC_RECONNECTION_TIMEOUT_SECS,
        RawDataClient::connect(channel.clone()),
    )
    .await?;

    let mut rpc_client = match connect_res {
        Ok(client) => client
            .accept_compressed(tonic::codec::CompressionEncoding::Gzip)
            .accept_compressed(tonic::codec::CompressionEncoding::Zstd)
            .send_compressed(tonic::codec::CompressionEncoding::Zstd)
            .max_decoding_message_size(MAX_RESPONSE_SIZE)
            .max_encoding_message_size(MAX_RESPONSE_SIZE),
        Err(e) => {
            bail!("Error connecting to GRPC client: {e}.");
        }
    };
    let count = ending_version.map(|v| (v as i64 - starting_version as i64 + 1) as u64);

    timeout(INDEXER_GRPC_RECONNECTION_TIMEOUT_SECS, async {
        let request = grpc_request_builder(starting_version, count, auth_token.clone());
        rpc_client.get_transactions(request).await
    })
    .await?
    .map_err(|e| anyhow!(e))
}

pub async fn create_grpc_connection(
    indexer_grpc_data_service_address: Url,
    auth_token: String,
    starting_version: u64,
    request_ending_version: Option<u64>,
    txn_sender: mpsc::Sender<Vec<Transaction>>,
) -> anyhow::Result<()> {
    info!("Connecting to GRPC stream.");
    let mut response = get_stream(
        indexer_grpc_data_service_address.clone(),
        starting_version,
        request_ending_version,
        auth_token.clone(),
    )
    .await?;
    info!("Successfully connected to GRPC stream.");

    let mut resp_stream = response.into_inner();

    let mut next_version_to_fetch = starting_version;
    let mut reconnection_retries = 0;
    let mut last_fetched_version = starting_version as i64 - 1;

    loop {
        let grpc_res =
            tokio::time::timeout(INDEXER_GRPC_RESPONSE_ITEM_TIMEOUT_SECS, resp_stream.next()).await;
        match grpc_res {
            Ok(Some(Ok(mut r))) => {
                reconnection_retries = 0;
                let start_version = r.transactions.first().unwrap().version;
                let end_version = r.transactions.last().unwrap().version;

                debug!(
                    start_version,
                    end_version,
                    count = r.transactions.len(),
                    "Received transactions from GRPC."
                );

                next_version_to_fetch = end_version + 1;

                r.transactions.retain(|r| {
                    if r.version < starting_version {
                        return false;
                    }
                    if let Some(request_ending_version) = request_ending_version {
                        if r.version > request_ending_version {
                            return false;
                        }
                    }
                    true
                });

                if last_fetched_version + 1 != start_version as i64 {
                    bail!(
                        "Received batch with gap from GRPC stream: got ...-{last_fetched_version} then {start_version}-..."
                    );
                }

                last_fetched_version = end_version as i64;

                if !r.transactions.is_empty() {
                    let pb_txn_chunks: Vec<Vec<Transaction>> = r
                        .transactions
                        .into_iter()
                        .chunks(CHANNEL_TXN_CHUNK_SIZE)
                        .into_iter()
                        .map(|chunk| chunk.collect())
                        .collect();
                    for txns in pb_txn_chunks {
                        match txn_sender.send(txns).await {
                            Ok(()) => {}
                            Err(e) => {
                                bail!("Error sending GRPC response to channel: {e}.")
                            }
                        }
                    }
                }
            }
            Ok(None) | Ok(Some(Err(_))) | Err(_) => {
                tracing::warn!(
                    grpc_response = ?grpc_res,
                    "Error receiving datastream response."
                );
                tokio::time::sleep(Duration::from_millis(200)).await;

                if reconnection_retries >= RECONNECTION_MAX_RETRIES {
                    bail!(
                        "Failed to reconnect to GRPC stream after {RECONNECTION_MAX_RETRIES} retries."
                    )
                }
                info!(
                    retries = reconnection_retries,
                    "Reconnecting to GRPC stream."
                );
                loop {
                    reconnection_retries += 1;
                    if reconnection_retries >= RECONNECTION_MAX_RETRIES {
                        bail!(
                            "Failed to reconnect to GRPC stream after {RECONNECTION_MAX_RETRIES} retries."
                        )
                    }
                    if let Ok(r) = get_stream(
                        indexer_grpc_data_service_address.clone(),
                        next_version_to_fetch,
                        request_ending_version,
                        auth_token.clone(),
                    )
                    .await
                    {
                        response = r;
                        break;
                    };
                }
                resp_stream = response.into_inner();
                info!("Successfully reconnected to GRPC stream.");
            }
        };
        if request_ending_version.is_some_and(|e| next_version_to_fetch > e) {
            break Ok(());
        }
    }
}
