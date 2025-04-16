-- Your SQL goes here

CREATE VIEW market_state AS
SELECT
    mlse.*,
    dv.daily_volume
FROM
    market_latest_state_event mlse
INNER JOIN
    market_daily_volume dv ON mlse.market_id = dv.market_id;

CREATE INDEX mkt_state_by_bump_time_idx
ON market_latest_state_event (bump_time DESC);

CREATE INDEX mkt_state_by_mkt_cap_idx
ON market_latest_state_event (instantaneous_stats_market_cap DESC);

CREATE INDEX mkt_state_by_all_time_volume_idx
ON market_latest_state_event (cumulative_stats_quote_volume DESC);

CREATE INDEX mkt_state_by_emojis_idx
ON market_latest_state_event (symbol_emojis);

-- Currently we cannot index on `daily_volume` because it's a VIEW column.
