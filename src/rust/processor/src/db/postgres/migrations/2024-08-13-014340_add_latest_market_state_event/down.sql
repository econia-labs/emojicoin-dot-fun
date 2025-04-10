-- This file should undo anything in `up.sql`

DROP INDEX mkts_post_bonding_curve_idx;
DROP INDEX user_lp_pools_idx;
DROP INDEX unique_mkts_idx;

DROP TABLE user_liquidity_pools;
DROP TABLE market_latest_state_event;
