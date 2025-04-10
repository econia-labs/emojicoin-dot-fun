-- This file should undo anything in `up.sql`
CREATE INDEX bytea_index ON unregistered_markets (emojis);
CLUSTER unregistered_markets USING bytea_index;
DROP INDEX bytea_index;

DROP FUNCTION random_symbols;
DROP EXTENSION tsm_system_rows;
