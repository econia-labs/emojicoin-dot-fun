mod cli;
mod db;
mod grpc;
mod processor;

use anyhow::bail;
use clap::Parser;
use cli::Args;
use sdk::util::Addresses;
use grpc::create_grpc_connection;
use processor::Processor;
use tokio::{join, task::JoinSet, try_join};
use tracing::{Instrument, error, info, info_span};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(std::env::var("AXOLOTL_LOG_LEVEL").unwrap_or_default())
        .init();

    let args = Args::parse();

    if let Some(current_version) = args.current_version {
        if current_version <= args.start_version {
            bail!("Current version must be greater than start version.");
        }
        if current_version - args.start_version < args.jobs {
            bail!("Cannot index less versions than jobs.");
        }
    }

    info!(
        start_version = args.start_version,
        current_version = args.current_version,
        jobs = args.jobs,
        "Starting indexer."
    );

    let mut joinset = JoinSet::new();

    let recv = {
        let (send, recv) = tokio::sync::mpsc::channel(1024);

        if let Some(current_version) = args.current_version {
            let versions = current_version - args.start_version;
            let jobs = args.jobs;
            let versions_per_job = versions / jobs;
            for i in 0..jobs {
                let start_version = args.start_version + i * versions_per_job;
                let end_version = if i == jobs - 1 {
                    current_version
                } else {
                    args.start_version + (i + 1) * versions_per_job
                };
                joinset.spawn(
                    create_grpc_connection(
                        args.grpc_url.clone(),
                        args.grpc_auth.clone(),
                        start_version,
                        Some(end_version),
                        send.clone(),
                    )
                    .instrument(info_span!("grpc_backfill", job = i)),
                );
            }
        }
        recv
    };

    let mut processor = Processor::new(
        args.db_url,
        Addresses {
            emojicoin_dot_fun: Some(args.emojicoin_dot_fun_address),
            arena: args.emojicoin_arena_address,
            favorites: args.emojicoin_favorites_address,
        },
    )
    .await?;

    match join!(joinset.join_all(), processor.backfill(recv)) {
        (v, Ok(_)) => {
            for res in v {
                if let Err(error) = res {
                    error!(
                        ?error,
                        "Indexer encountered an error while getting events from GRPC."
                    );
                    bail!("Indexer encountered an error while getting events from GRPC.");
                }
            }
            info!(
                start_version = args.start_version,
                current_version = args.current_version,
                "Indexer successfully got all events from GRPC."
            );
        }
        (_, Err(error)) => {
            error!(
                ?error,
                "Indexer encountered an error while getting events from GRPC."
            );
            bail!("Indexer encountered an error while getting events from GRPC.");
        }
    }

    match processor.process_backfill().await {
        Ok(_) => {
            info!(
                start_version = args.start_version,
                current_version = args.current_version,
                "Indexer successfully backfilled."
            );
        }
        Err(error) => {
            error!(?error, "Indexer encountered an error while backfilling.");
            bail!("Indexer encountered an error while backfilling.");
        }
    }

    if args.exit {
        return Ok(());
    }

    let (send, recv) = tokio::sync::mpsc::channel(1024);

    let grpc = create_grpc_connection(
        args.grpc_url.clone(),
        args.grpc_auth.clone(),
        args.current_version.unwrap_or(args.start_version),
        None,
        send,
    );

    match try_join!(grpc, processor.start(recv)) {
        Ok(_) => {
            info!(
                start_version = args.start_version,
                end_version = args.current_version,
                "Indexer successfully finished."
            );
        }
        Err(error) => {
            error!(?error, "Indexer encountered an error.");
        }
    };

    Ok(())
}
