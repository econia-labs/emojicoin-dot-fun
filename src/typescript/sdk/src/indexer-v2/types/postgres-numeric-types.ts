// cspell:word bigserial
// cspell:word smallserial
import { type AnyColumnName } from "./json-types";

const floats: Set<string> = new Set(["numeric", "decimal", "double precision", "real"]);
const bigints: Set<string> = new Set(["bigint", "bigserial"]);
const integers: Set<string> = new Set(["smallint", "integer", "serial", "smallserial"]);

/**
 * @see {@link https://www.postgresql.org/docs/current/datatype-numeric.html}
 */
export const PostgresNumericTypes = {
  floats,
  bigints,
  integers,
};

/**
 * The column names in the `emojicoin` database with a float-like type.
 * @see PostgresNumericTypes
 *
 * These are verified with the `postgrest` schema response.
 * @see schema.test.ts
 */
export const floatColumns: Set<AnyColumnName> = new Set([
  "avg_execution_price_q64",
  "balance_as_fraction_of_circulating_supply_after_q64",
  "balance_as_fraction_of_circulating_supply_before_q64",
  "balance_as_fraction_of_circulating_supply_q64",
  "base_amount",
  "base_donation_claim_amount",
  "base_volume",
  "base_volume_in_1m_state_tracker",
  "circulating_supply",
  "clamm_virtual_reserves_base",
  "clamm_virtual_reserves_quote",
  "close_price_q64",
  "cpamm_real_reserves_base",
  "cpamm_real_reserves_quote",
  "cumulative_chat_messages",
  "cumulative_integrator_fees",
  "cumulative_quote_volume",
  "cumulative_stats_base_volume",
  "cumulative_stats_integrator_fees",
  "cumulative_stats_n_chat_messages",
  "cumulative_stats_n_swaps",
  "cumulative_stats_pool_fees_base",
  "cumulative_stats_pool_fees_quote",
  "cumulative_stats_quote_volume",
  "cumulative_swaps",
  "daily_base_volume",
  "daily_tvl_per_lp_coin_growth",
  "daily_volume",
  "fully_diluted_value",
  "high_price_q64",
  "input_amount",
  "instantaneous_stats_fully_diluted_value",
  "instantaneous_stats_market_cap",
  "instantaneous_stats_total_quote_locked",
  "instantaneous_stats_total_value_locked",
  "integrator_fee",
  "integrator_fees",
  "last_swap_avg_execution_price_q64",
  "last_swap_base_volume",
  "last_swap_nonce",
  "last_swap_quote_volume",
  "low_price_q64",
  "lp_coin_amount",
  "lp_coin_balance",
  "lp_coin_supply",
  "market_cap",
  "market_id",
  "market_nonce",
  "n_chat_messages",
  "n_swaps",
  "net_proceeds",
  "nonce",
  "open_price_q64",
  "pnl",
  "pool_fee",
  "pool_fees_base",
  "pool_fees_quote",
  "quote_amount",
  "quote_donation_claim_amount",
  "quote_volume",
  "registry_nonce",
  "total_quote_locked",
  "total_value_locked",
  "tvl_per_lp_coin_growth_q64",
  "user_emojicoin_balance",
  "volume",
  "volume_base",
  "volume_in_1m_state_tracker",
  "volume_quote",

  // Arena
  "melee_id",
  "start_time",
  "duration",
  "max_match_percentage",
  "max_match_amount",
  "available_rewards",
  "match_amount",
  "emojicoin_0_proceeds",
  "emojicoin_1_proceeds",
  "emojicoin_0_exchange_rate_base",
  "emojicoin_1_exchange_rate_base",
  "emojicoin_0_exchange_rate_quote",
  "emojicoin_1_exchange_rate_quote",
  "tap_out_fee",
  "new_balance",
  "emojicoin_0_balance",
  "emojicoin_1_balance",
  "profits",
  "losses",
  "volume",
  "rewards_remaining",
  "apt_locked",
]);

/**
 * The column names in the `emojicoin` database with a bigint-like type.
 * @see PostgresNumericTypes
 *
 * These are verified with the `postgrest` schema response.
 * @see schema.test.ts
 */
export const bigintColumns: Set<AnyColumnName> = new Set([
  "block_number",
  "event_index",
  "last_success_version",
  "transaction_version",
]);

/**
 * The column names in the `emojicoin` database with an integer-like type.
 * @see PostgresNumericTypes
 *
 * These are verified with the `postgrest` schema response.
 * @see schema.test.ts
 */
export const integerColumns: Set<AnyColumnName> = new Set(["integrator_fee_rate_bps"]);
