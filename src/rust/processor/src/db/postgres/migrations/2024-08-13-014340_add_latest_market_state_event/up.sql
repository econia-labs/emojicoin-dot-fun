-- Your SQL goes here

CREATE TABLE market_latest_state_event (
  -- Transaction metadata.
  transaction_version BIGINT NOT NULL,
  sender VARCHAR(66) NOT NULL,
  entry_function VARCHAR(200),
  transaction_timestamp TIMESTAMP NOT NULL,
  inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Market and state metadata.
  market_id NUMERIC NOT NULL,
  symbol_bytes BYTEA NOT NULL,
  symbol_emojis TEXT[] NOT NULL,
  bump_time TIMESTAMP NOT NULL, -- Note that bump and emit time are interchangeable.
  market_nonce NUMERIC NOT NULL,
  trigger trigger_type NOT NULL,
  market_address VARCHAR(66) NOT NULL,

  -- State event data.
  clamm_virtual_reserves_base NUMERIC NOT NULL,
  clamm_virtual_reserves_quote NUMERIC NOT NULL,
  cpamm_real_reserves_base NUMERIC NOT NULL,
  cpamm_real_reserves_quote NUMERIC NOT NULL,
  lp_coin_supply NUMERIC NOT NULL,
  cumulative_stats_base_volume NUMERIC NOT NULL,
  cumulative_stats_quote_volume NUMERIC NOT NULL,
  cumulative_stats_integrator_fees NUMERIC NOT NULL,
  cumulative_stats_pool_fees_base NUMERIC NOT NULL,
  cumulative_stats_pool_fees_quote NUMERIC NOT NULL,
  cumulative_stats_n_swaps NUMERIC NOT NULL,
  cumulative_stats_n_chat_messages NUMERIC NOT NULL,
  instantaneous_stats_total_quote_locked NUMERIC NOT NULL,
  instantaneous_stats_total_value_locked NUMERIC NOT NULL,
  instantaneous_stats_market_cap NUMERIC NOT NULL,
  instantaneous_stats_fully_diluted_value NUMERIC NOT NULL,
  last_swap_is_sell BOOLEAN NOT NULL,
  last_swap_avg_execution_price_q64 NUMERIC NOT NULL,
  last_swap_base_volume NUMERIC NOT NULL,
  last_swap_quote_volume NUMERIC NOT NULL,
  last_swap_nonce NUMERIC NOT NULL,
  last_swap_time TIMESTAMP NOT NULL,

  -- Querying all post-bonding curve markets. i.e., markets with liquidity pools.
  daily_tvl_per_lp_coin_growth_q64 NUMERIC NOT NULL,
  in_bonding_curve BOOLEAN NOT NULL,
  volume_in_1m_state_tracker NUMERIC NOT NULL,

  PRIMARY KEY (market_id)
);

CREATE INDEX mkts_post_bonding_curve_idx
ON market_latest_state_event (in_bonding_curve)
INCLUDE (market_id)
WHERE in_bonding_curve = FALSE;

CREATE INDEX unique_mkts_idx
ON market_latest_state_event (market_id);

CREATE TABLE user_liquidity_pools (
  provider VARCHAR(66) NOT NULL,
  transaction_version BIGINT NOT NULL,
  transaction_timestamp TIMESTAMP NOT NULL,
  inserted_at TIMESTAMP NOT NULL DEFAULT NOW(),

  market_id NUMERIC NOT NULL,
  symbol_bytes BYTEA NOT NULL,
  symbol_emojis TEXT[] NOT NULL,
  bump_time TIMESTAMP NOT NULL,
  market_nonce NUMERIC NOT NULL,
  trigger trigger_type NOT NULL,
  market_address VARCHAR(66) NOT NULL,

  -- Liquidity event data.
  base_amount NUMERIC NOT NULL,
  quote_amount NUMERIC NOT NULL,
  lp_coin_amount NUMERIC NOT NULL,
  liquidity_provided BOOLEAN NOT NULL,
  base_donation_claim_amount NUMERIC NOT NULL,
  quote_donation_claim_amount NUMERIC NOT NULL,

  lp_coin_balance NUMERIC NOT NULL,

  PRIMARY KEY (provider, market_id)
);

CREATE INDEX user_lp_pools_idx
ON user_liquidity_pools (provider, market_id DESC);

