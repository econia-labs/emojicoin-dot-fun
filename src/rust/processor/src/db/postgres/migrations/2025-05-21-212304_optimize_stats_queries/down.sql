-- This file should undo anything in `up.sql`

DROP VIEW IF EXISTS price_feed_with_nulls;

DROP INDEX IF EXISTS mkt_state_by_last_swap_avg_price_idx;
DROP INDEX IF EXISTS mkt_state_by_tvl_idx;
