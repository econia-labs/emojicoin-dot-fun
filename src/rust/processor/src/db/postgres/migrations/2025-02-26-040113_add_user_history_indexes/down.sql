-- This file should undo anything in `up.sql`

DROP INDEX IF EXISTS sender_all_swap_hstry_idx;
DROP INDEX IF EXISTS sender_mkt_swap_hstry_idx;
DROP INDEX IF EXISTS sender_all_chat_hstry_idx;
DROP INDEX IF EXISTS sender_mkt_chat_hstry_idx;
DROP INDEX IF EXISTS sender_all_pool_hstry_idx;
DROP INDEX IF EXISTS sender_mkt_pool_hstry_idx;
DROP INDEX IF EXISTS sender_mkt_rgstr_hstry_idx;


ALTER TABLE chat_events
    DROP COLUMN event_index;
ALTER TABLE market_registration_events
    DROP COLUMN event_index;
