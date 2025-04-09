-- Your SQL goes here

-- This function atomically returns the state of all market states at a single
-- point in time- specifically, when the transaction version is equal to the
-- `last_emojicoin_transaction_version` returned.
--
-- It's possible to verify the data integrity of the database to some extent
-- by comparing the values of global on-chain state against these aggregate
-- values.
--
-- Note that the latest global state event data in the database isn't returned here
-- because it's not the latest global state, it's the latest *emitted* global state.
--
-- To verify the data integrity at a specific transaction version, retrieve the
-- on-chain global state resource where the transaction version specified is the
-- `last_emojicoin_transaction_version` that this function returns, and then compare
-- all values.
--
-- NOTE: `last_success_version` from the `processor_status` is not synced with
-- new event data inserted and can actually be behind the highest emojicoin
-- transaction version. To properly get the last successfully processed and inserted
-- emojicoin version, it's necessary to get the max transaction version among
-- all transaction versions.
CREATE FUNCTION aggregate_market_state() RETURNS TABLE(
  last_emojicoin_transaction_version BIGINT,

  -- The following columns are structured to match all the `registry_view` fields.
  cumulative_chat_messages NUMERIC,
  cumulative_integrator_fees NUMERIC,
  cumulative_quote_volume NUMERIC,
  cumulative_swaps NUMERIC,
  fully_diluted_value NUMERIC,
  -- Note this is the last `global_state_event.bump_time`,
  -- not the most recent market state event bump time.
  last_bump_time TIMESTAMP,
  market_cap NUMERIC,
  n_markets NUMERIC,
  nonce NUMERIC,
  total_quote_locked NUMERIC,
  total_value_locked NUMERIC,
  
  n_markets_in_bonding_curve NUMERIC,
  n_markets_post_bonding_curve NUMERIC,

  n_global_state_events BIGINT,
  n_market_registration_events BIGINT,
  n_swap_events BIGINT,
  n_chat_events BIGINT,
  n_liquidity_events BIGINT 
)
AS $$
WITH agg_ms AS (
  SELECT
      MAX(transaction_version) AS last_emojicoin_transaction_version,

      -- The following columns mirror the `registry_view` return value structure.
      SUM(cumulative_stats_n_chat_messages) AS cumulative_chat_messages,
      SUM(cumulative_stats_integrator_fees) AS cumulative_integrator_fees,
      SUM(cumulative_stats_quote_volume) AS cumulative_quote_volume,
      SUM(cumulative_stats_n_swaps) AS cumulative_swaps,
      SUM(instantaneous_stats_fully_diluted_value) AS fully_diluted_value,
      -- Note this is most recent market state event bump time,
      -- not the last `global_state_event.bump_time`.
      MAX(bump_time) AS last_bump_time, 
      SUM(instantaneous_stats_market_cap) AS market_cap,
      COUNT(*) AS n_markets,
      -- Add one to account for `init_module` incrementing the registry nonce without
      -- incrementing a market's `market_nonce`.
      SUM(market_nonce) + 1 AS nonce,
      SUM(instantaneous_stats_total_quote_locked) AS total_quote_locked,
      SUM(instantaneous_stats_total_value_locked) AS total_value_locked,

      COUNT(*) FILTER (WHERE in_bonding_curve = true) AS n_markets_in_bonding_curve,
      COUNT(*) FILTER (WHERE in_bonding_curve = false) AS n_markets_post_bonding_curve
  FROM market_state
),
n_rows AS (
  SELECT 
      (SELECT COUNT(*) FROM global_state_events) AS n_global_state_events,
      (SELECT COUNT(*) FROM market_registration_events) AS n_market_registration_events,
      (SELECT COUNT(*) FROM swap_events) AS n_swap_events,
      (SELECT COUNT(*) FROM chat_events) AS n_chat_events,
      (SELECT COUNT(*) FROM liquidity_events) AS n_liquidity_events
)
SELECT
  agg_ms.*,
  n_rows.*
FROM agg_ms, n_rows;
$$ LANGUAGE SQL;
