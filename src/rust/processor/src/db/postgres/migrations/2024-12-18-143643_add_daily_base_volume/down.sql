-- This file should undo anything in `up.sql`

-- Drop dependent objects

DROP VIEW price_feed;
DROP VIEW market_state;
DROP VIEW market_daily_volume;
DROP INDEX mkt_1m_prds_last_24h_idx;


-- Remove the added columns

ALTER TABLE market_1m_periods_in_last_day DROP COLUMN base_volume;

ALTER TABLE market_latest_state_event DROP COLUMN base_volume_in_1m_state_tracker;

-- Recreate dependent objects

CREATE INDEX mkt_1m_prds_last_24h_idx
ON market_1m_periods_in_last_day (market_id)
INCLUDE (start_time, volume);

CREATE VIEW market_daily_volume AS
WITH recent_volumes AS (
    SELECT
        market_id,
        COALESCE(SUM(volume), 0::NUMERIC) AS volume
    FROM market_1m_periods_in_last_day
    WHERE
        start_time > NOW() - INTERVAL '24' HOUR
    GROUP BY
        market_id
),
latest_state_volumes AS (
    SELECT
        market_id,
        CASE
            WHEN bump_time > NOW() - INTERVAL '24' HOUR
            THEN COALESCE(volume_in_1m_state_tracker, 0::NUMERIC)
            ELSE 0::NUMERIC
        END AS volume_in_1m_state_tracker
    FROM
        market_latest_state_event
)
SELECT
    lsv.market_id,
    COALESCE(rv.volume, 0::NUMERIC) + COALESCE(lsv.volume_in_1m_state_tracker, 0::NUMERIC) AS daily_volume
FROM
    latest_state_volumes lsv
LEFT JOIN
    recent_volumes rv ON lsv.market_id = rv.market_id;

CREATE VIEW market_state AS
SELECT
    mlse.*,
    dv.daily_volume
FROM
    market_latest_state_event mlse
INNER JOIN
    market_daily_volume dv ON mlse.market_id = dv.market_id;

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
