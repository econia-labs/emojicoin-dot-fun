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
  "cumulative_quote_volume",
  "total_quote_locked",
  "total_value_locked",
  "market_cap",
  "fully_diluted_value",
  "cumulative_integrator_fees",
  "last_swap_avg_execution_price_q64",
  "open_price_q64",
  "high_price_q64",
  "low_price_q64",
  "close_price_q64",
  "volume_base",
  "volume_quote",
  "integrator_fees",
  "pool_fees_base",
  "pool_fees_quote",
  "tvl_per_lp_coin_growth_q64",
  "avg_execution_price_q64",
  "lp_coin_supply",
  "cumulative_stats_base_volume",
  "cumulative_stats_quote_volume",
  "cumulative_stats_integrator_fees",
  "cumulative_stats_pool_fees_base",
  "cumulative_stats_pool_fees_quote",
  "instantaneous_stats_total_value_locked",
  "instantaneous_stats_market_cap",
  "instantaneous_stats_fully_diluted_value",
  "balance_as_fraction_of_circulating_supply_before_q64",
  "balance_as_fraction_of_circulating_supply_after_q64",
  "balance_as_fraction_of_circulating_supply_q64",
  "daily_tvl_per_lp_coin_growth",
  "volume_in_1m_state_tracker",
  "daily_volume",
  "volume",
]);

/**
 * The column names in the `emojicoin` database with a bigint-like type.
 * @see PostgresNumericTypes
 *
 * These are verified with the `postgrest` schema response.
 * @see schema.test.ts
 */
export const bigintColumns: Set<AnyColumnName> = new Set([
  "transaction_version",
  "registry_nonce",
  "cumulative_swaps",
  "cumulative_chat_messages",
  "market_id",
  "market_nonce",
  "last_swap_base_volume",
  "last_swap_quote_volume",
  "last_swap_nonce",
  "n_swaps",
  "n_chat_messages",
  "integrator_fee",
  "input_amount",
  "net_proceeds",
  "base_volume",
  "quote_volume",
  "pool_fee",
  "clamm_virtual_reserves_base",
  "clamm_virtual_reserves_quote",
  "cpamm_real_reserves_base",
  "cpamm_real_reserves_quote",
  "cumulative_stats_n_swaps",
  "cumulative_stats_n_chat_messages",
  "instantaneous_stats_total_quote_locked",
  "base_amount",
  "quote_amount",
  "lp_coin_amount",
  "base_donation_claim_amount",
  "quote_donation_claim_amount",
  "user_emojicoin_balance",
  "circulating_supply",
  "lp_coin_balance",
  "nonce",
  "last_success_version",
]);

/**
 * The column names in the `emojicoin` database with an integer-like type.
 * @see PostgresNumericTypes
 *
 * These are verified with the `postgrest` schema response.
 * @see schema.test.ts
 */
export const integerColumns: Set<AnyColumnName> = new Set(["integrator_fee_rate_bps"]);
