-- This file should undo anything in `up.sql`

DROP INDEX IF EXISTS se_block_num;
ALTER TABLE swap_events
        DROP COLUMN block_number,
        DROP COLUMN event_index;

DROP INDEX IF EXISTS le_block_num;
ALTER TABLE liquidity_events
        DROP COLUMN block_number,
        DROP COLUMN event_index;