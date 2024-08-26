import {
  type AccountAddressString,
  type HexString,
  type Uint128String,
  type Uint64String,
} from "../../emojicoin_dot_fun/types";
import { type Flatten } from "../../types";

type PeriodType =
  | "period_1m"
  | "period_5m"
  | "period_15m"
  | "period_30m"
  | "period_1h"
  | "period_4h"
  | "period_1d";

type TriggerType =
  | "package_publication"
  | "market_registration"
  | "swap_buy"
  | "swap_sell"
  | "provide_liquidity"
  | "remove_liquidity"
  | "chat";

/**
 * This type is used to make it explicit that although the string is in a date format,
 * it is actually a string
 * Keep in mind that it includes microseconds, unlike the JavaScript Date object.
 */
type PostgresTimestamp = string;

/**
 * Converts a PostgreSQL timestamp string to microseconds since the Unix epoch.
 *
 * @param {PostgresTimestamp} timestamp - A PostgreSQL timestamp: "YYYY-MM-DDTHH:mm:ss.SSSSSS"
 * @returns {bigint} The number of microseconds since the Unix epoch: January 1, 1970, 00:00:00 UTC.
 *   The fractional seconds part can have 1 to 6 digits.
 * @throws {Error} If the timestamp string dose not contain a valid microseconds part.
 *
 * @example
 * const timestamp1 = "2024-08-24T19:23:01.940306";
 * console.log(postgresTimestampToMicroseconds(timestamp1).toString()); // 1724598581940306
 *
 * const timestamp2 = "2024-08-24T19:23:01.94";
 * console.log(postgresTimestampToMicroseconds(timestamp2).toString()); // 1724598581940000
 *
 * @remarks
 * - This function assumes that the input timestamp is in UTC. If the timestamp is in a different
 *   timezone, it should be converted to UTC before passing it to this function.
 * - The function uses JavaScript's built-in Date object to parse the main part of the timestamp,
 *   which provides millisecond precision. It then extracts the fractional seconds part using a
 *   regular expression and combines both to achieve microsecond precision.
 * - If the fractional seconds part has fewer than 6 digits, it's padded with zeros to microsecond
 *   precision.
 */
export const postgresTimestampToMicroseconds = (timestamp: PostgresTimestamp): bigint => {
  const timestampToSecondPrecision = timestamp.split(".")[0];

  let restOfTimestamp = timestamp.split(".")[1] ?? "";
  if (!restOfTimestamp) {
    const numCharsAfterSecondColon = timestamp.split(":", 3)[2].length;
    if (
      !(
        numCharsAfterSecondColon === 2 ||
        (numCharsAfterSecondColon === 3 && timestamp.endsWith("Z"))
      )
    ) {
      throw new Error("Invalid PostgreSQL timestamp: missing fractional seconds.");
    }
  }
  if (restOfTimestamp && restOfTimestamp.endsWith("Z")) {
    // Remove the "Z" at the end before parsing the microseconds.
    restOfTimestamp = restOfTimestamp.slice(0, -1);
  }
  restOfTimestamp.padEnd(6, "0");

  const milliseconds = new Date(`${timestampToSecondPrecision}Z`).getTime();
  const microseconds = BigInt(restOfTimestamp);
  console.log(milliseconds, microseconds);
  return BigInt(milliseconds) * 1000n + microseconds;
};

console.log(postgresTimestampToMicroseconds("2024-08-24T19:23:01.000000").toString());
console.log(postgresTimestampToMicroseconds("2024-08-24T19:23:01.0").toString());
console.log(postgresTimestampToMicroseconds("2024-08-24T19:23:01").toString());

/**
 * Converts a PostgreSQL timestamp string to a JavaScript Date object.
 *
 * Note:
 *
 * @param {PostgresTimestamp} timestamp - PostgreSQL timestamp (YYYY-MM-DDTHH:mm:ss.SSSSSS).
 * @returns {Date} JavaScript Date object with millisecond precision.
 *
 * @example
 * postgresTimestampToDate("2024-08-24T19:23:01.940306").toISOString() // "2024-08-24T19:23:01.940Z"
 *
 * @remarks
 * Uses postgresTimestampToMicroseconds for parsing, then converts microseconds
 * to milliseconds to create the Date object. This approach preserves the full
 * precision of the PostgreSQL timestamp up to JavaScript Date's millisecond limit.
 *
 * NOTE: We can't use `new Date(timestamp)` directly because it incorrectly parses the timestamp by
 * ignoring the milliseconds and using the microseconds as milliseconds.
 * This method parses the full timestamp to microseconds, then converts to milliseconds, ensuring
 * we preserve the PostgreSQL timestamp's precision up to JavaScript's millisecond limit.
 */
export const postgresTimestampToDate = (timestamp: PostgresTimestamp): Date => {
  const microseconds = postgresTimestampToMicroseconds(timestamp);
  return new Date(Number(microseconds / 1000n));
};

type TransactionMetadata = {
  transaction_version: Uint64String;
  sender: AccountAddressString;
  entry_function?: string | null;
  transaction_timestamp: PostgresTimestamp;
  inserted_at: PostgresTimestamp;
};

type MarketAndStateMetadata = {
  market_id: Uint64String;
  symbol_bytes: HexString;
  bump_time: PostgresTimestamp;
  market_nonce: Uint64String;
  trigger: TriggerType;
};

export type WithEmitTime<T> = {
  emit_time: PostgresTimestamp;
} & Omit<T, "bump_time">;

type LastSwapData = {
  last_swap_is_sell: boolean;
  last_swap_avg_execution_price_q64: Uint128String;
  last_swap_base_volume: Uint64String;
  last_swap_quote_volume: Uint64String;
  last_swap_nonce: Uint64String;
  last_swap_time: PostgresTimestamp;
};

type PeriodicStateMetadata = {
  period: PeriodType;
  start_time: PostgresTimestamp;
};

type PeriodicStateEventData = {
  open_price_q64: Uint128String;
  high_price_q64: Uint128String;
  low_price_q64: Uint128String;
  close_price_q64: Uint128String;
  volume_base: Uint128String;
  volume_quote: Uint128String;
  integrator_fees: Uint128String;
  pool_fees_base: Uint128String;
  pool_fees_quote: Uint128String;
  n_swaps: Uint64String;
  n_chat_messages: Uint64String;
  starts_in_bonding_curve: boolean;
  ends_in_bonding_curve: boolean;
  tvl_per_lp_coin_growth_q64: Uint128String;
};

type MarketRegistrationEventData = {
  registrant: AccountAddressString;
  integrator: AccountAddressString;
  integrator_fee: Uint64String;
};

type SwapEventData = {
  swapper: AccountAddressString;
  integrator: AccountAddressString;
  integrator_fee: Uint64String;
  input_amount: Uint64String;
  is_sell: boolean;
  integrator_fee_rate_bps: number;
  net_proceeds: Uint64String;
  base_volume: Uint64String;
  quote_volume: Uint64String;
  avg_execution_price_q64: Uint128String;
  pool_fee: Uint64String;
  starts_in_bonding_curve: boolean;
  results_in_state_transition: boolean;
  balance_as_fraction_of_circulating_supply_before_q64: Uint128String;
  balance_as_fraction_of_circulating_supply_after_q64: Uint128String;
};

type LiquidityEventData = {
  provider: AccountAddressString;
  base_amount: Uint64String;
  quote_amount: Uint64String;
  lp_coin_amount: Uint64String;
  liquidity_provided: boolean;
  base_donation_claim_amount: Uint64String;
  quote_donation_claim_amount: Uint64String;
};

type ChatEventData = {
  user: AccountAddressString;
  message: string;
  user_emojicoin_balance: Uint64String;
  circulating_supply: Uint64String;
  balance_as_fraction_of_circulating_supply_q64: Uint128String;
};

type StateEventData = {
  clamm_virtual_reserves_base: Uint64String;
  clamm_virtual_reserves_quote: Uint64String;
  cpamm_real_reserves_base: Uint64String;
  cpamm_real_reserves_quote: Uint64String;
  lp_coin_supply: Uint128String;
  cumulative_stats_base_volume: Uint128String;
  cumulative_stats_quote_volume: Uint128String;
  cumulative_stats_integrator_fees: Uint128String;
  cumulative_stats_pool_fees_base: Uint128String;
  cumulative_stats_pool_fees_quote: Uint128String;
  cumulative_stats_n_swaps: Uint64String;
  cumulative_stats_n_chat_messages: Uint64String;
  instantaneous_stats_total_quote_locked: Uint64String;
  instantaneous_stats_total_value_locked: Uint128String;
  instantaneous_stats_market_cap: Uint128String;
  instantaneous_stats_fully_diluted_value: Uint128String;
};

type GlobalStateEventData = {
  emit_time: PostgresTimestamp;
  registry_nonce: Uint64String;
  trigger: TriggerType;
  cumulative_quote_volume: Uint128String;
  total_quote_locked: Uint128String;
  total_value_locked: Uint128String;
  market_cap: Uint128String;
  fully_diluted_value: Uint128String;
  cumulative_integrator_fees: Uint128String;
  cumulative_swaps: Uint64String;
  cumulative_chat_messages: Uint64String;
};

export type DatabaseDataTypes2 =
  | TransactionMetadata
  | MarketAndStateMetadata
  | LastSwapData
  | PeriodicStateMetadata
  | PeriodicStateEventData
  | MarketRegistrationEventData
  | SwapEventData
  | LiquidityEventData
  | ChatEventData
  | StateEventData
  | GlobalStateEventData;

export type DatabaseDataTypes = {
  TransactionMetadata: TransactionMetadata;
  MarketAndStateMetadata: MarketAndStateMetadata;
  LastSwapData: LastSwapData;
  PeriodicStateMetadata: PeriodicStateMetadata;
  PeriodicStateEventData: PeriodicStateEventData;
  MarketRegistrationEventData: MarketRegistrationEventData;
  SwapEventData: SwapEventData;
  LiquidityEventData: LiquidityEventData;
  ChatEventData: ChatEventData;
  StateEventData: StateEventData;
  GlobalStateEventData: GlobalStateEventData;
};

export type DatabaseSnakeCaseModels = {
  GlobalStateEventModel: Flatten<TransactionMetadata & GlobalStateEventData>;
  PeriodicStateEventModel: Flatten<
    TransactionMetadata &
      WithEmitTime<MarketAndStateMetadata> &
      LastSwapData &
      PeriodicStateMetadata &
      PeriodicStateEventData
  >;
  MarketRegistrationEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & MarketRegistrationEventData
  >;
  SwapEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & LastSwapData & SwapEventData & StateEventData
  >;
  ChatEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & ChatEventData & StateEventData
  >;
  LiquidityEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & LiquidityEventData & StateEventData
  >;
  MarketLatestStateEventModel: Flatten<
    TransactionMetadata &
      MarketAndStateMetadata &
      StateEventData & {
        daily_tvl_per_lp_coin_growth_q64: Uint128String;
        in_bonding_curve: boolean;
        volume_in_1m_state_tracker: Uint128String;
      }
  >;
  UserLiquidityPoolsModel: Flatten<
    Omit<TransactionMetadata, "sender" | "entry_function"> &
      WithEmitTime<MarketAndStateMetadata> &
      LiquidityEventData
  >;
  MarketDailyVolumeModel: {
    market_id: Uint64String;
    daily_volume: Uint128String;
  };
  Market1MPeriodsInLastDay: {
    market_id: Uint64String;
    transaction_version: Uint64String;
    inserted_at: PostgresTimestamp;
    nonce: Uint64String;
    volume: Uint128String;
    start_time: PostgresTimestamp;
  };
};
export type DatabaseSchemaTypes = {
  global_state_events: Array<DatabaseSnakeCaseModels["GlobalStateEventModel"]>;
  periodic_state_events: Array<DatabaseSnakeCaseModels["PeriodicStateEventModel"]>;
  market_registration_events: Array<DatabaseSnakeCaseModels["MarketRegistrationEventModel"]>;
  swap_events: Array<DatabaseSnakeCaseModels["SwapEventModel"]>;
  chat_events: Array<DatabaseSnakeCaseModels["ChatEventModel"]>;
  liquidity_events: Array<DatabaseSnakeCaseModels["LiquidityEventModel"]>;
  market_latest_state_event: Array<DatabaseSnakeCaseModels["MarketLatestStateEventModel"]>;
  user_liquidity_pools: Array<DatabaseSnakeCaseModels["UserLiquidityPoolsModel"]>;
  market_daily_volume: Array<DatabaseSnakeCaseModels["MarketDailyVolumeModel"]>;
  market_1m_periods_in_last_day: Array<DatabaseSnakeCaseModels["Market1MPeriodsInLastDay"]>;
};

// Technically some of these are views, but may as well be tables in the context of the indexer.
export enum TableName {
  GlobalStateEvents = "global_state_events",
  PeriodicStateEvents = "periodic_state_events",
  MarketRegistrationEvents = "market_registration_events",
  SwapEvents = "swap_events",
  LiquidityEvents = "liquidity_events",
  ChatEvents = "chat_events",
  MarketLatestStateEvent = "market_latest_state_event",
  UserLiquidityPools = "user_liquidity_pools",
  MarketDailyVolume = "market_daily_volume",
  Market1MPeriodsInLastDay = "market_1m_periods_in_last_day",
}
