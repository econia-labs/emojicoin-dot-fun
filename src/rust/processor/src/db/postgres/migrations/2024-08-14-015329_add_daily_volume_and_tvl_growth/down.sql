-- This file should undo anything in `up.sql`

DROP INDEX mkt_1m_prds_last_24h_idx;
DROP VIEW market_daily_volume;
DROP TABLE market_1m_periods_in_last_day;
