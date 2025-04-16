-- Your SQL goes here

CREATE TABLE market_1m_periods_in_last_day (
    market_id NUMERIC NOT NULL,
    inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    transaction_version BIGINT NOT NULL,
    nonce NUMERIC NOT NULL, -- Market nonce.
    volume NUMERIC NOT NULL, -- Quote volume.
    start_time TIMESTAMP NOT NULL,

    PRIMARY KEY (market_id, nonce)
);

CREATE INDEX mkt_1m_prds_last_24h_idx
ON market_1m_periods_in_last_day (market_id)
INCLUDE (start_time, volume);

-- Calculate the 24h rolling volume for each market.
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
        END AS volume_in_1m_state_tracker
    FROM
        market_latest_state_event
)
-- Left join zero volume markets with > 0 volume markets and latest state volumes, then sum the volumes.
SELECT 
    lsv.market_id,
    COALESCE(rv.volume, 0::NUMERIC) + COALESCE(lsv.volume_in_1m_state_tracker, 0::NUMERIC) AS daily_volume
FROM 
    latest_state_volumes lsv
LEFT JOIN
    recent_volumes rv ON lsv.market_id = rv.market_id;
