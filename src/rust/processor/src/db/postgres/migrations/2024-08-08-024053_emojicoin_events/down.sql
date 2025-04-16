-- This file should undo anything in `up.sql`
DROP INDEX swaps_by_mkt_and_time_idx;
DROP INDEX chats_by_mkt_and_time_idx;
DROP INDEX prdc_evts_by_res_idx;

DROP TABLE global_state_events;
DROP TABLE periodic_state_events;
DROP TABLE market_registration_events;
DROP TABLE swap_events;
DROP TABLE chat_events;
DROP TABLE liquidity_events;

DROP TYPE trigger_type;
DROP TYPE period_type;
