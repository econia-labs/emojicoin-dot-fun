-- This file should undo anything in `up.sql`
DROP FUNCTION user_pools(provider text);
CREATE FUNCTION user_pools(provider text) RETURNS TABLE(
  transaction_version BIGINT,
  sender VARCHAR(66),
  entry_function VARCHAR(200),
  transaction_timestamp TIMESTAMP,
  inserted_at TIMESTAMP,

  -- Market and state metadata.
  market_id NUMERIC,
  symbol_bytes BYTEA,
  symbol_emojis TEXT[],
  bump_time TIMESTAMP, -- Note that bump and emit time are interchangeable.
  market_nonce NUMERIC,
  trigger trigger_type,
  market_address VARCHAR(66),

  -- State event data.
  clamm_virtual_reserves_base NUMERIC,
  clamm_virtual_reserves_quote NUMERIC,
  cpamm_real_reserves_base NUMERIC,
  cpamm_real_reserves_quote NUMERIC,
  lp_coin_supply NUMERIC,
  cumulative_stats_base_volume NUMERIC,
  cumulative_stats_quote_volume NUMERIC,
  cumulative_stats_integrator_fees NUMERIC,
  cumulative_stats_pool_fees_base NUMERIC,
  cumulative_stats_pool_fees_quote NUMERIC,
  cumulative_stats_n_swaps NUMERIC,
  cumulative_stats_n_chat_messages NUMERIC,
  instantaneous_stats_total_quote_locked NUMERIC,
  instantaneous_stats_total_value_locked NUMERIC,
  instantaneous_stats_market_cap NUMERIC,
  instantaneous_stats_fully_diluted_value NUMERIC,
  last_swap_is_sell BOOLEAN,
  last_swap_avg_execution_price_q64 NUMERIC,
  last_swap_base_volume NUMERIC,
  last_swap_quote_volume NUMERIC,
  last_swap_nonce NUMERIC,
  last_swap_time TIMESTAMP,

  -- Querying all post-bonding curve markets. i.e., markets with liquidity pools.
  daily_tvl_per_lp_coin_growth NUMERIC,
  in_bonding_curve BOOLEAN,
  volume_in_1m_state_tracker NUMERIC,

  daily_volume NUMERIC,

  lp_coin_balance NUMERIC
)
AS $$
SELECT
  ms.transaction_version,
  ms.sender,
  ms.entry_function,
  ms.transaction_timestamp,
  ms.inserted_at,

  -- Market and state metadata.
  ms.market_id,
  ms.symbol_bytes,
  ms.symbol_emojis,
  ms.bump_time,
  ms.market_nonce,
  ms.trigger,
  ms.market_address,

  -- State event data.
  ms.clamm_virtual_reserves_base,
  ms.clamm_virtual_reserves_quote,
  ms.cpamm_real_reserves_base,
  ms.cpamm_real_reserves_quote,
  ms.lp_coin_supply,
  ms.cumulative_stats_base_volume,
  ms.cumulative_stats_quote_volume,
  ms.cumulative_stats_integrator_fees,
  ms.cumulative_stats_pool_fees_base,
  ms.cumulative_stats_pool_fees_quote,
  ms.cumulative_stats_n_swaps,
  ms.cumulative_stats_n_chat_messages,
  ms.instantaneous_stats_total_quote_locked,
  ms.instantaneous_stats_total_value_locked,
  ms.instantaneous_stats_market_cap,
  ms.instantaneous_stats_fully_diluted_value,
  ms.last_swap_is_sell,
  ms.last_swap_avg_execution_price_q64,
  ms.last_swap_base_volume,
  ms.last_swap_quote_volume,
  ms.last_swap_nonce,
  ms.last_swap_time,

  -- Querying all post-bonding curve markets. i.e., markets with liquidity pools.
  ms.daily_tvl_per_lp_coin_growth,
  ms.in_bonding_curve,
  ms.volume_in_1m_state_tracker,

  ms.daily_volume,

  ulp.lp_coin_balance
FROM
    market_state AS ms,
    user_liquidity_pools AS ulp
WHERE ms.market_id = ulp.market_id
AND ulp.provider = $1
AND lp_coin_balance <> 0
$$ LANGUAGE SQL;
