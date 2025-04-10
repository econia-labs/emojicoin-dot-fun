-- Your SQL goes here

-- We order rows in the table by their MD5 hash. This will give the impression of randomness to the order.
-- To do this, we create an index, order the rows by that index, then drop the index.
CREATE INDEX hash_index ON unregistered_markets ((md5(emojis)));
CLUSTER unregistered_markets USING hash_index;
DROP INDEX hash_index;

-- Next, we enable the following extension which will allow us to use SYSTEM_ROWS.
-- SYSTEM_ROWS(N) will pick N random rows (or less if the table doesn't have N rows) and return them.
-- Since the function is prone to clustering, and almost all returned rows are consecutive, we have the previous step to make consecutive rows appear random.
CREATE EXTENSION tsm_system_rows;
CREATE or replace FUNCTION random_symbols() RETURNS TABLE(emojis BYTEA) AS $$
SELECT * FROM unregistered_markets TABLESAMPLE SYSTEM_ROWS(100);
$$ LANGUAGE SQL;
