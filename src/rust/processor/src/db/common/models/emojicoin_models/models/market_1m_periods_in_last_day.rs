use super::market_24h_rolling_volume::RecentOneMinutePeriodicStateEvent;
use crate::schema::{self, market_1m_periods_in_last_day};
use aptos_indexer_processor_sdk::postgres::utils::database::MAX_DIESEL_PARAM_SIZE;
use bigdecimal::BigDecimal;
use chrono::NaiveDateTime;
use diesel::{
    dsl::{now, IntervalDsl},
    result::Error,
};
use diesel_async::{
    pooled_connection::bb8::PooledConnection, scoped_futures::ScopedFutureExt, AsyncConnection,
    AsyncPgConnection,
};
use field_count::FieldCount;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, FieldCount, Identifiable, Insertable, Serialize)]
#[diesel(primary_key(market_id, nonce))]
#[diesel(table_name = market_1m_periods_in_last_day)]
pub struct MarketOneMinutePeriodsInLastDayModel {
    pub market_id: BigDecimal,
    pub nonce: BigDecimal,
    pub transaction_version: i64,
    pub volume: BigDecimal,
    pub base_volume: BigDecimal,
    pub start_time: NaiveDateTime,
}

impl From<RecentOneMinutePeriodicStateEvent> for MarketOneMinutePeriodsInLastDayModel {
    fn from(event: RecentOneMinutePeriodicStateEvent) -> Self {
        MarketOneMinutePeriodsInLastDayModel {
            market_id: event.market_id,
            nonce: event.market_nonce,
            transaction_version: event.transaction_version,
            volume: event.period_quote_volume,
            base_volume: event.period_base_volume,
            start_time: event.start_time,
        }
    }
}

impl MarketOneMinutePeriodsInLastDayModel {
    pub async fn insert_and_delete_periods(
        items: Vec<MarketOneMinutePeriodsInLastDayModel>,
        conn: &mut PooledConnection<'_, AsyncPgConnection>,
    ) -> Result<(), diesel::result::Error> {
        use diesel::prelude::*;
        use schema::market_1m_periods_in_last_day::dsl::*;

        conn.transaction::<_, Error, _>(|conn| {
            async move {
                let mut inserted = 0;
                for items in items.chunks(MAX_DIESEL_PARAM_SIZE) {
                    inserted += diesel_async::RunQueryDsl::execute(
                        diesel::insert_into(schema::market_1m_periods_in_last_day::table)
                            .values(items)
                            .on_conflict((market_id, nonce))
                            .do_nothing(),
                        conn,
                    )
                    .await?;
                }

                let deleted = diesel_async::RunQueryDsl::execute(
                    diesel::delete(schema::market_1m_periods_in_last_day::table)
                        .filter(start_time.lt(now - 24.hours())),
                    conn,
                )
                .await?;

                Ok((inserted, deleted))
            }
            .scope_boxed()
        })
        .await?;

        Ok(())
    }
}
