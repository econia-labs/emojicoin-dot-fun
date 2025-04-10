-- This file should undo anything in `up.sql`
CREATE OR REPLACE FUNCTION price_feed() RETURNS TABLE(
  market_id NUMERIC,
  symbol_bytes BYTEA,
  symbol_emojis TEXT[],
  market_address VARCHAR(66),
  open_price_q64 NUMERIC,
  close_price_q64 NUMERIC
)
AS $$
WITH markets AS (
    SELECT market_id
    FROM market_daily_volume
    ORDER BY daily_volume DESC
    LIMIT 25
),
swap24 AS (
    SELECT DISTINCT ON (market_id)
        market_id,
        avg_execution_price_q64
    FROM swap_events
    WHERE transaction_timestamp <= CURRENT_TIMESTAMP - interval '1 day'
    ORDER BY
        market_id,
        transaction_timestamp DESC
)
SELECT
    swap_close.market_id,
    swap_close.symbol_bytes,
    swap_close.symbol_emojis,
    swap_close.market_address,
    swap_open.avg_execution_price_q64 AS open_price_q64,
    swap_close.last_swap_avg_execution_price_q64 AS close_price_q64
FROM markets
INNER JOIN market_latest_state_event AS swap_close ON markets.market_id = swap_close.market_id
INNER JOIN swap24 AS swap_open ON markets.market_id = swap_open.market_id
WHERE swap_close.transaction_timestamp > CURRENT_TIMESTAMP - interval '1 day'
$$ LANGUAGE SQL;
