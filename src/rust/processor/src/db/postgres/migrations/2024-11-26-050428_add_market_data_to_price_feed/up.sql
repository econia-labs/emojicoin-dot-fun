-- Your SQL goes here
DROP FUNCTION price_feed;
ALTER INDEX price_feed RENAME TO price_feed_idx;

CREATE OR REPLACE VIEW price_feed AS
WITH markets AS (
    SELECT market_id
    FROM market_state
    ORDER BY daily_volume DESC
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
),
first_swap AS (
    SELECT DISTINCT ON (market_id)
        market_id,
        avg_execution_price_q64
    FROM swap_events
    ORDER BY
        market_id,
        transaction_timestamp ASC
)
SELECT 
    latest_swap.*,
    COALESCE(swap_open.avg_execution_price_q64, first_swap.avg_execution_price_q64) AS open_price_q64,
    latest_swap.last_swap_avg_execution_price_q64 AS close_price_q64
FROM markets
INNER JOIN market_state AS latest_swap ON markets.market_id = latest_swap.market_id
INNER JOIN first_swap ON markets.market_id = first_swap.market_id
LEFT JOIN swap24 AS swap_open ON markets.market_id = swap_open.market_id
WHERE latest_swap.transaction_timestamp > CURRENT_TIMESTAMP - interval '1 day';
