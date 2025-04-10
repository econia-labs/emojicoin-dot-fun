-- This file should undo anything in `up.sql`

DROP VIEW market_state;
DROP INDEX mkt_state_by_bump_time_idx;
DROP INDEX mkt_state_by_emojis_idx;
DROP INDEX mkt_state_by_mkt_cap_idx;
DROP INDEX mkt_state_by_all_time_volume_idx;
