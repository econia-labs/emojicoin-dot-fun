use std::{
    collections::{BTreeMap, HashMap},
    time::Instant,
};

use aptos_protos::transaction::v1::{
    Transaction, transaction::TxnData, transaction_payload::Payload,
};
use bigdecimal::BigDecimal;
use chrono::{DateTime, TimeDelta, Utc};
use sdk::{Event, util::Addresses};
use itertools::Itertools;
use sqlx::{Pool, Postgres, postgres::PgPoolOptions, query};
use tokio::sync::mpsc;
use tracing::{debug, error, info, trace};

use pipeline::*;

mod pipeline;

pub struct Processor {
    pool: Pool<Postgres>,
    addresses: Addresses,
}

impl Processor {
    pub async fn new(db_url: String, addresses: Addresses) -> anyhow::Result<Self> {
        let pool = PgPoolOptions::new()
            .max_connections(5)
            .connect(&db_url)
            .await?;
        Ok(Self { pool, addresses })
    }

    async fn event_loop(
        &mut self,
        mut recv: mpsc::Receiver<Vec<Transaction>>,
        mut pipelines: Vec<Box<dyn Pipeline>>,
    ) -> anyhow::Result<()> {
        let mut timer = BTreeMap::new();
        loop {
            let Some(transactions) = recv.recv().await else {
                info!("Channel closed.");
                break Ok(());
            };

            let first = transactions.first().unwrap().version;
            let last = transactions.last().unwrap().version;
            let total_count = transactions.len();
            let now = Utc::now();
            timer.insert(now, total_count);
            let tps = timer
                .range(now - TimeDelta::seconds(10)..now)
                .fold(0, |a, b| a + b.1)
                / 10;

            let transactions = transactions
                .into_iter()
                .filter_map(|t| TransactionData::from_aptos_transaction(t, &self.addresses))
                .collect_vec();

            let relevant_count = transactions.len();

            let instant = Instant::now();
            if relevant_count > 0 {
                info!(
                    first,
                    last, total_count, relevant_count, tps, "Processing batch of transactions."
                );
            } else {
                trace!(
                    first,
                    last,
                    total_count,
                    tps,
                    "Got batch of transactions with no relevant transactions."
                );
            }
            let mut db_tx = self.pool.begin().await?;
            self.process_batch(transactions, &mut pipelines, &mut db_tx)
                .await?;
            db_tx.commit().await?;
            let duration = instant.elapsed();
            if relevant_count > 0 {
                info!(
                    first,
                    last,
                    total_count,
                    relevant_count,
                    ?duration,
                    "Processed batch of transactions."
                );
            }
        }
    }

    async fn process_batch(
        &self,
        transactions: Vec<TransactionData>,
        pipelines: &mut Vec<Box<dyn Pipeline>>,
        db_tx: &mut sqlx::Transaction<'static, Postgres>,
    ) -> anyhow::Result<()> {
        for pipeline in pipelines {
            for transaction in &transactions {
                debug!(pipeline = pipeline.name(), "Running pipeline.");
                pipeline.process(transaction).await.inspect_err(|e| {
                    error!(
                        error = ?e,
                        version = transaction.version.to_string(),
                        "Ecountered error while processing transaction."
                    );
                })?;
            }
            pipeline.insert(db_tx).await?;
        }
        Ok(())
    }

    /// Start the processor with only the event pipeline.
    pub async fn backfill(&mut self, recv: mpsc::Receiver<Vec<Transaction>>) -> anyhow::Result<()> {
        self.event_loop(recv, vec![Box::new(EventPipeline::new())])
            .await
    }

    /// Start the processor with all the pipelines besides the event pipeline.
    ///
    /// Transaction data will be read from the database instead of a receiver.
    pub async fn process_backfill(&mut self) -> anyhow::Result<()> {
        let mut version = BigDecimal::from(0);
        let mut pipelines: Vec<Box<dyn Pipeline>> = vec![
            Box::new(MarketPipeline::new()),
            Box::new(SwapPipeline::new()),
            Box::new(ChatPipeline::new()),
            Box::new(CandlestickPipeline::new()),
            Box::new(FavoritePipeline::new()),
            Box::new(VaultPipeline::new()),
            Box::new(MeleePipeline::new()),
            Box::new(PositionPipeline::new()),
            Box::new(MeleeCandlestickPipeline::new()),
        ];
        loop {
            let mut db_tx = self.pool.begin().await?;
            let events = query!(r#"
                    SELECT transaction_version, event_index, timestamp, data
                    FROM event
                    WHERE transaction_version > $1
                    AND COALESCE(transaction_version <= (SELECT DISTINCT transaction_version FROM event WHERE transaction_version > $1 ORDER BY transaction_version OFFSET 1000 LIMIT 1), true)
                    ORDER BY transaction_version, event_index
                "#,
                version
            ).fetch_all(&mut *db_tx).await?;
            if events.is_empty() {
                break;
            }
            let first = events.first().unwrap().transaction_version.to_string();
            let last = events.last().unwrap().transaction_version.to_string();
            let count = events.len();
            let instant = Instant::now();
            info!(first, last, count, "Processing batch of events.");
            let mut transactions: HashMap<BigDecimal, TransactionData> = HashMap::new();

            for event in events {
                let event_data: Event = serde_json::from_value(event.data)?;
                transactions
                    .entry(event.transaction_version.clone())
                    .and_modify(|transaction_data| {
                        transaction_data.events.push(event_data.clone());
                    })
                    .or_insert_with(|| TransactionData {
                        events: vec![event_data],
                        version: event.transaction_version.clone(),
                        timestamp: event.timestamp,
                    });
                version = version.max(event.transaction_version);
            }

            let transactions = transactions.into_values().collect_vec();

            self.process_batch(transactions, &mut pipelines, &mut db_tx)
                .await?;

            db_tx.commit().await?;

            let duration = instant.elapsed();
            info!(
                first,
                last,
                count,
                ?duration,
                "Processed batch of transactions."
            );
        }
        Ok(())
    }

    /// Start the processor with all the available pipelines.
    pub async fn start(&mut self, recv: mpsc::Receiver<Vec<Transaction>>) -> anyhow::Result<()> {
        self.event_loop(
            recv,
            vec![
                Box::new(EventPipeline::new()),
                Box::new(MarketPipeline::new()),
                Box::new(SwapPipeline::new()),
                Box::new(ChatPipeline::new()),
                Box::new(CandlestickPipeline::new()),
                Box::new(FavoritePipeline::new()),
                Box::new(VaultPipeline::new()),
                Box::new(MeleePipeline::new()),
                Box::new(PositionPipeline::new()),
                Box::new(MeleeCandlestickPipeline::new()),
            ],
        )
        .await
    }
}

pub struct TransactionData {
    pub events: Vec<Event>,
    pub version: BigDecimal,
    pub timestamp: DateTime<Utc>,
}

impl TransactionData {
    pub fn from_aptos_transaction(transaction: Transaction, addresses: &Addresses) -> Option<Self> {
        if let Some(TxnData::User(user_transaction)) = transaction.txn_data.as_ref() {
            if let Some(utr) = user_transaction.request.as_ref() {
                if let Some(payload) = utr.payload.as_ref() {
                    if let Some(Payload::EntryFunctionPayload(efp)) = payload.payload.as_ref() {
                        if let Some(function) = efp.function.as_ref() {
                            if let Some(module) = function.module.as_ref() {
                                if addresses.contains(&module.address) {
                                    let timestamp = transaction.timestamp.unwrap();
                                    let events = user_transaction.events
                                        .clone()
                                        .into_iter()
                                        .filter_map(|ev|
                                            Event::from_with_addresses(ev.clone(), addresses)
                                                .inspect_err(|err| error!(error = ?err, event = ?ev, "Could not parse event."))
                                                .unwrap_or(None)
                                        )
                                        .collect_vec();
                                    return Some(TransactionData {
                                        version: BigDecimal::from(transaction.version),
                                        events,
                                        timestamp: DateTime::from_timestamp(
                                            timestamp.seconds,
                                            timestamp.nanos as u32,
                                        )
                                        .unwrap(),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
        None
    }
}
