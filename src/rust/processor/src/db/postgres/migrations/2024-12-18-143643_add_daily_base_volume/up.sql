-- Your SQL goes here
-- Keep volume as volume in order to avoid breaking changes
-- The new column will be named base_volume.

-- Add base volume to market_1m_periods_in_last_day.
DELETE FROM market_1m_periods_in_last_day;
ALTER TABLE market_1m_periods_in_last_day ADD COLUMN base_volume NUMERIC NOT NULL;
INSERT INTO market_1m_periods_in_last_day (market_id, inserted_at, transaction_version, nonce, volume, start_time, base_volume)
SELECT market_id, inserted_at, transaction_version, market_nonce, volume_quote, start_time, volume_base
FROM periodic_state_events WHERE period = 'period_1m' AND start_time > NOW() - INTERVAL '24' HOUR;

-- Add base_volume to the index.
DROP INDEX mkt_1m_prds_last_24h_idx;

CREATE INDEX mkt_1m_prds_last_24h_idx
ON market_1m_periods_in_last_day (market_id)
INCLUDE (start_time, volume, base_volume);

-- Add base volume to market_latest_state_event.
ALTER TABLE market_latest_state_event
ADD COLUMN base_volume_in_1m_state_tracker NUMERIC NOT NULL;

-- Calculate the 24h rolling volume for each market.
CREATE OR REPLACE VIEW market_daily_volume AS
WITH recent_volumes AS (
    SELECT
        market_id,
        COALESCE(SUM(volume), 0::NUMERIC) AS volume,
        COALESCE(SUM(base_volume), 0::NUMERIC) AS base_volume
    FROM market_1m_periods_in_last_day
    WHERE
        start_time > NOW() - INTERVAL '24' HOUR
    GROUP BY
        market_id
),
-- Get the latest state tracker volume for each market, aka the unclosed 1min candle volume that hasn't
-- been emitted as a periodic state event yet.
latest_state_volumes AS (
    SELECT
        market_id,
        -- Don't include the volume in the state tracker if the bump time is older than 1 day.
        -- This means the volume calculation period is technically 24 hours + up to 1 minute.
        -- Note that we use `INTERVAL '24' HOUR` because `'1' DAY` does not always equal 24h.
        -- See: https://www.postgresql.org/docs/9.1/functions-datetime.html, quote below:
        -- | this means interval '1 day' does not necessarily equal interval '24 hours'.
        CASE
            WHEN bump_time > NOW() - INTERVAL '24' HOUR
            THEN COALESCE(volume_in_1m_state_tracker, 0::NUMERIC)
            ELSE 0::NUMERIC
        END AS volume_in_1m_state_tracker,
        CASE
            WHEN bump_time > NOW() - INTERVAL '24' HOUR
            THEN COALESCE(base_volume_in_1m_state_tracker, 0::NUMERIC)
            ELSE 0::NUMERIC
        END AS base_volume_in_1m_state_tracker
    FROM
        market_latest_state_event
)
-- Left join zero volume markets with > 0 volume markets and latest state volumes, then sum the volumes.
SELECT
    lsv.market_id,
    COALESCE(rv.volume, 0::NUMERIC) + COALESCE(lsv.volume_in_1m_state_tracker, 0::NUMERIC) AS daily_volume,
    COALESCE(rv.base_volume, 0::NUMERIC) + COALESCE(lsv.base_volume_in_1m_state_tracker, 0::NUMERIC) AS daily_base_volume
FROM
    latest_state_volumes lsv
LEFT JOIN
    recent_volumes rv ON lsv.market_id = rv.market_id;

-- Recreate this view and its dependent objects to get the new column
DROP VIEW price_feed;
DROP VIEW market_state;

CREATE VIEW market_state AS
SELECT
    mlse.*,
    dv.daily_volume,
    dv.daily_base_volume
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
