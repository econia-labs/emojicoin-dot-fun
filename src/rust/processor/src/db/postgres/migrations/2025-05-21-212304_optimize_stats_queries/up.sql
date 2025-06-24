-- Your SQL goes here

-- Can't create an index on `delta_percentage` since it's a view-only calculated column, otherwise
-- it'd be good to have an index for it here.
-- The other un-indexed columns used in market stats queries are below.
CREATE INDEX IF NOT EXISTS mkt_state_by_last_swap_avg_price_idx 
ON market_latest_state_event (last_swap_avg_execution_price_q64 DESC);

CREATE INDEX IF NOT EXISTS mkt_state_by_tvl_idx
ON market_latest_state_event (instantaneous_stats_total_value_locked DESC);

-- Join market_state entries with their corresponding 24h price delta entries, if they exist.
-- Using `postgrest` filters to achieve the same thing, with `.in` or `or.(eq...eq...eq...)`
-- is extremely inefficient and slows down the query by a factor of 100-150x.
-- Thus the below view is necessary to avoid 20+ second query times on a query that should take
-- less than 200ms.
-- Note that this view is still ~30-50x less performant than `market_state`. It should only
-- be used as an optimization for specific queries when necessary.
-- For markets without any volume in the past 24 hours, the three new `price_feed` columns
-- are `null`.
CREATE VIEW price_feed_with_nulls AS
SELECT
  ms.*,
  pf.open_price_q64, -- `null` if no volume in the last 24h.
  pf.close_price_q64, -- `null` if no volume in the last 24h.
  pf.delta_percentage -- `null` if no volume in the last 24h.
FROM
  market_state ms
LEFT JOIN price_feed pf
  ON ms.market_id = pf.market_id;
