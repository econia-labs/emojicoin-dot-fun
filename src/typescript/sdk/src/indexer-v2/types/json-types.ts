// cspell:word DDTHH

import type { SymbolEmoji } from "../../emoji_data";
import type {
  AccountAddressString,
  Uint64String,
  Uint128String,
  UnsizedDecimalString,
} from "../../emojicoin_dot_fun/types";
import type { Flatten, JsonTypes } from "../../types";

export type PeriodTypeFromDatabase =
  | "period_15s"
  | "period_1m"
  | "period_5m"
  | "period_15m"
  | "period_30m"
  | "period_1h"
  | "period_4h"
  | "period_1d";

export type PeriodTypeFromBroker =
  | "FifteenSeconds"
  | "OneMinute"
  | "FiveMinutes"
  | "FifteenMinutes"
  | "ThirtyMinutes"
  | "OneHour"
  | "FourHours"
  | "OneDay";

export type TriggerTypeFromDatabase =
  | "package_publication"
  | "market_registration"
  | "swap_buy"
  | "swap_sell"
  | "provide_liquidity"
  | "remove_liquidity"
  | "chat";

export type TriggerTypeFromBroker =
  | "PackagePublication"
  | "MarketRegistration"
  | "SwapBuy"
  | "SwapSell"
  | "ProvideLiquidity"
  | "RemoveLiquidity"
  | "Chat";

/**
 * This type is used to make it explicit that although the string is in a date format,
 * it is actually a string
 * Keep in mind that it includes microseconds, unlike the JavaScript Date object.
 */
type PostgresTimestamp = string;

/**
 * Converts a PostgreSQL timestamp string to microseconds since the Unix epoch.
 *
 * NOTE: This function assumes that the input timestamp is in UTC, but without the "Z" suffix.
 * If that changes, this function will break. This is intentional.
 *
 * This function takes a PostgreSQL timestamp string and converts it to the number of
 * microseconds elapsed since the Unix epoch (January 1, 1970, 00:00:00 UTC). It handles
 * timestamps with varying precision in the fractional seconds part, from 1 to 6 digits.
 *
 * @param {PostgresTimestamp} timestamp - A PostgreSQL timestamp string in ISO-8601 format, with up
 * to 6 digits of microsecond precision. Specifically: "YYYY-MM-DDTHH:mm:ss.SSSSSS"
 * @returns {bigint} The number of microseconds since the Unix epoch.
 *
 * @example
 * const timestamp1 = "2024-08-24T19:23:01.940306";
 * console.log(postgresTimestampToMicroseconds(timestamp1).toString()); // 1724598581940306
 *
 * @example
 * const timestamp2 = "2024-08-24T19:23:01.94";
 * console.log(postgresTimestampToMicroseconds(timestamp2).toString()); // 1724598581940000
 *
 * @note
 * - The function can handle timestamps with or without fractional seconds.
 * - If fractional seconds are provided, they can have 1 to 6 digits of precision.
 * - If fewer than 6 digits are provided for fractional seconds, the function pads the value with
 *   zeros to ensure microsecond precision.
 * - The function uses the BigInt type to ensure precision when dealing with microsecond timestamps.
 * @typedef {string} PostgresTimestamp A string in the format "YYYY-MM-DDTHH:mm:ss.SSSSSS"
 */
export const postgresTimestampToMicroseconds = (timestamp: PostgresTimestamp | Date): bigint => {
  // If the timestamp is already a date, just return it as microseconds.
  if (timestamp instanceof Date) return BigInt(timestamp.getTime() * 1000);

  // If the incoming string ends with a "Z", remove it- we will add it later.
  if (timestamp.endsWith("Z")) timestamp = timestamp.slice(0, -1);

  const spl = timestamp.split(".");
  const microseconds = spl.length === 1 ? 0n : BigInt(spl[1].padEnd(6, "0"));

  // Get the date to the nearest second. Ensure JavaScript parses it as a UTC date.
  const dateToNearestSecond = new Date(`${spl[0]}Z`);

  // Convert it to milliseconds.
  const inMilliseconds = dateToNearestSecond.getTime();
  // Convert it to microseconds; add the microseconds portion from the original timestamp.
  return BigInt(inMilliseconds * 1000) + microseconds;
};

/**
 * Converts a PostgreSQL timestamp string to a JavaScript Date object. If the input is already
 * a Date object, just return it.
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
 */
export const postgresTimestampToDate = (timestamp: PostgresTimestamp | Date): Date => {
  if (timestamp instanceof Date) return timestamp;
  const microseconds = postgresTimestampToMicroseconds(timestamp);
  return new Date(Number(microseconds / 1000n));
};

// `inserted_at` is omitted if the data comes from the broker.
type TransactionMetadata = {
  transaction_version: Uint64String | number;
  sender: AccountAddressString;
  entry_function?: string | null;
  transaction_timestamp: PostgresTimestamp;
  inserted_at?: PostgresTimestamp;
};

export type BlockAndEventIndexMetadata = {
  block_number: Uint64String;
  event_index: number;
};

type PostgresBytes = `\\x${string}`;
type BrokerBytes = number[];

type MarketAndStateMetadata = {
  market_id: Uint64String;
  symbol_bytes: PostgresBytes | BrokerBytes;
  symbol_emojis: SymbolEmoji[];
  bump_time: PostgresTimestamp;
  market_nonce: Uint64String;
  trigger: TriggerTypeFromDatabase | TriggerTypeFromBroker;
  market_address: AccountAddressString;
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
  period: PeriodTypeFromDatabase | PeriodTypeFromBroker;
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
  sender: AccountAddressString;
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
} & LastSwapData;

type GlobalStateEventData = {
  emit_time: PostgresTimestamp;
  registry_nonce: Uint64String;
  trigger: TriggerTypeFromDatabase | TriggerTypeFromBroker;
  cumulative_quote_volume: Uint128String;
  total_quote_locked: Uint128String;
  total_value_locked: Uint128String;
  market_cap: Uint128String;
  fully_diluted_value: Uint128String;
  cumulative_integrator_fees: Uint128String;
  cumulative_swaps: Uint64String;
  cumulative_chat_messages: Uint64String;
};

// Utility type for converting the fullnode JSON type data to flattened Database JSON type data.
type FlattenedExchangeRateWithEventIndex<T extends keyof JsonTypes> = Flatten<
  Omit<JsonTypes[T], keyof JsonTypes["ExchangeRate"]> & {
    event_index: Uint64String;
    emojicoin_0_exchange_rate_base: Uint64String;
    emojicoin_0_exchange_rate_quote: Uint64String;
    emojicoin_1_exchange_rate_base: Uint64String;
    emojicoin_1_exchange_rate_quote: Uint64String;
  }
>;
type CandlestickData = {
  market_id: Uint64String;
  last_transaction_version: Uint64String;
  period: PeriodTypeFromDatabase | PeriodTypeFromBroker;
  start_time: PostgresTimestamp;

  open_price: number;
  close_price: number;
  high_price: number;
  low_price: number;

  symbol_emojis: SymbolEmoji[];

  volume: Uint64String;
};

type ArenaMeleeEventData = Flatten<
  Omit<JsonTypes["ArenaMeleeEvent"], "start_time"> & {
    event_index: Uint64String;
    start_time: PostgresTimestamp;
  }
>;

type ArenaEnterEventData = FlattenedExchangeRateWithEventIndex<"ArenaEnterEvent">;
type ArenaExitEventData = FlattenedExchangeRateWithEventIndex<"ArenaExitEvent"> & {
  apt_proceeds: Uint64String;
  during_melee: boolean;
};
type ArenaSwapEventData = FlattenedExchangeRateWithEventIndex<"ArenaSwapEvent"> & {
  during_melee: boolean;
};

type ArenaVaultBalanceUpdateEventData = {
  event_index: Uint64String;
  new_balance: Uint64String;
};

type ArenaPositionData = {
  user: AccountAddressString;
  last_transaction_version: Uint64String;
  melee_id: Uint64String;
  open: boolean;
  emojicoin_0_balance: Uint64String;
  emojicoin_1_balance: Uint64String;
  withdrawals: Uint64String;
  deposits: Uint64String;
  last_exit_0: boolean | null;
  match_amount: Uint64String;
};

type ArenaInfoData = {
  melee_id: Uint64String;
  last_transaction_version: Uint64String;
  volume: Uint64String;
  rewards_remaining: Uint64String;
  emojicoin_0_locked: Uint64String;
  emojicoin_1_locked: Uint64String;
  emojicoin_0_market_address: AccountAddressString;
  emojicoin_0_symbols: SymbolEmoji[];
  emojicoin_0_market_id: Uint64String;
  emojicoin_1_market_address: AccountAddressString;
  emojicoin_1_symbols: SymbolEmoji[];
  emojicoin_1_market_id: Uint64String;
  start_time: PostgresTimestamp;
  duration: Uint64String;
  max_match_percentage: Uint64String;
  max_match_amount: Uint64String;
};

type ArenaLeaderboardHistoryData = {
  user: AccountAddressString;
  last_transaction_version: Uint64String;
  melee_id: Uint64String;
  profits: Uint64String;
  losses: Uint64String;
  last_exit_0: boolean | null;
  emojicoin_0_balance: Uint64String;
  emojicoin_1_balance: Uint64String;
  exited: boolean;
  withdrawals: Uint64String;
};

type ArenaLeaderboardHistoryWithArenaInfoData = Flatten<
  Pick<
    ArenaLeaderboardHistoryData,
    | "user"
    | "melee_id"
    | "profits"
    | "losses"
    | "withdrawals"
    | "emojicoin_0_balance"
    | "emojicoin_1_balance"
    | "exited"
    | "last_exit_0"
  > &
    Pick<
      ArenaInfoData,
      | "emojicoin_0_symbols"
      | "emojicoin_1_symbols"
      | "emojicoin_0_market_address"
      | "emojicoin_1_market_address"
      | "emojicoin_0_market_id"
      | "emojicoin_1_market_id"
      | "start_time"
      | "duration"
    > & {
      leaderboard_history_last_transaction_version: Uint64String;
      arena_info_last_transaction_version: Uint64String;
    }
>;

type ArenaLeaderboardData = {
  user: AccountAddressString;
  last_transaction_version: Uint64String;
  open: boolean;
  emojicoin_0_balance: Uint64String;
  emojicoin_1_balance: Uint64String;
  profits: Uint64String;
  losses: Uint64String;
  pnl_percent: number;
  pnl_octas: number;
  withdrawals: Uint64String;
};

type ArenaCandlestickData = {
  melee_id: Uint64String;
  last_transaction_version: Uint64String;
  period: PeriodTypeFromDatabase | PeriodTypeFromBroker;
  start_time: PostgresTimestamp;

  open_price: number;
  close_price: number;
  high_price: number;
  low_price: number;

  volume: Uint64String;
  n_swaps: Uint64String;
};

export type DatabaseStructType = {
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
  Candlestick: CandlestickData;
  ArenaMelee: ArenaMeleeEventData;
  ArenaEnter: ArenaEnterEventData;
  ArenaExit: ArenaExitEventData;
  ArenaSwap: ArenaSwapEventData;
  ArenaVaultBalanceUpdate: ArenaVaultBalanceUpdateEventData;
  ArenaPosition: ArenaPositionData;
  ArenaLeaderboard: ArenaLeaderboardData;
  ArenaLeaderboardHistory: ArenaLeaderboardHistoryData;
  ArenaInfo: ArenaInfoData;
  ArenaCandlestick: ArenaCandlestickData;
};

export type BrokerJsonTypes =
  | DatabaseJsonType["global_state_events"]
  | DatabaseJsonType["periodic_state_events"]
  | DatabaseJsonType["market_registration_events"]
  | DatabaseJsonType["swap_events"]
  | DatabaseJsonType["chat_events"]
  | DatabaseJsonType["liquidity_events"]
  | DatabaseJsonType["market_latest_state_event"]
  | DatabaseJsonType["arena_enter_events"]
  | DatabaseJsonType["arena_melee_events"]
  | DatabaseJsonType["arena_exit_events"]
  | DatabaseJsonType["arena_swap_events"]
  | DatabaseJsonType["arena_vault_balance_update_events"];

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
  MarketState = "market_state",
  ProcessorStatus = "processor_status",
  PriceFeed = "price_feed",
  Candlesticks = "candlesticks",
  ArenaMeleeEvents = "arena_melee_events",
  ArenaEnterEvents = "arena_enter_events",
  ArenaExitEvents = "arena_exit_events",
  ArenaSwapEvents = "arena_swap_events",
  ArenaVaultBalanceUpdateEvents = "arena_vault_balance_update_events",
  ArenaPosition = "arena_position",
  ArenaInfo = "arena_info",
  ArenaCandlesticks = "arena_candlesticks",
  // The view for the current arena leaderboard, all users.
  ArenaLeaderboard = "arena_leaderboard",
  // The table for a user's historic arena pnl.
  ArenaLeaderboardHistory = "arena_leaderboard_history",
  // A user's leaderboard history combined with the arena info.
  ArenaLeaderboardHistoryWithArenaInfo = "arena_leaderboard_history_with_arena_info",
}

export enum DatabaseRpc {
  UserPools = "user_pools",
  AggregateMarketState = "aggregate_market_state",
}

// Fields that only exist after being processed by a processor.
export type ProcessedFields = {
  daily_tvl_per_lp_coin_growth: UnsizedDecimalString;
  in_bonding_curve: boolean;
  volume_in_1m_state_tracker: Uint128String;
  base_volume_in_1m_state_tracker: Uint128String;
};

type UserLPCoinBalance = {
  lp_coin_balance: Uint64String;
};

export type DatabaseJsonType = {
  [TableName.GlobalStateEvents]: Flatten<TransactionMetadata & GlobalStateEventData>;
  [TableName.PeriodicStateEvents]: Flatten<
    TransactionMetadata &
      WithEmitTime<MarketAndStateMetadata> &
      LastSwapData &
      PeriodicStateMetadata &
      PeriodicStateEventData
  >;
  [TableName.MarketRegistrationEvents]: Flatten<
    TransactionMetadata & MarketAndStateMetadata & MarketRegistrationEventData
  >;
  [TableName.SwapEvents]: Flatten<
    TransactionMetadata &
      MarketAndStateMetadata &
      SwapEventData &
      StateEventData &
      BlockAndEventIndexMetadata
  >;
  [TableName.LiquidityEvents]: Flatten<
    TransactionMetadata &
      MarketAndStateMetadata &
      LiquidityEventData &
      StateEventData &
      BlockAndEventIndexMetadata
  >;
  [TableName.ChatEvents]: Flatten<
    TransactionMetadata & MarketAndStateMetadata & ChatEventData & StateEventData
  >;
  [TableName.MarketLatestStateEvent]: Flatten<
    TransactionMetadata & MarketAndStateMetadata & StateEventData & ProcessedFields
  >;
  [TableName.UserLiquidityPools]: Flatten<
    Omit<TransactionMetadata, "sender" | "entry_function"> &
      WithEmitTime<MarketAndStateMetadata> &
      LiquidityEventData &
      UserLPCoinBalance
  >;
  [TableName.MarketDailyVolume]: {
    market_id: Uint64String;
    daily_volume: Uint128String;
  };
  [TableName.Market1MPeriodsInLastDay]: {
    market_id: Uint64String;
    transaction_version: Uint64String;
    inserted_at?: PostgresTimestamp; // Omitted if the data is transmitted from the broker.
    nonce: Uint64String;
    volume: Uint128String;
    base_volume: Uint128String;
    start_time: PostgresTimestamp;
  };
  [TableName.MarketState]: DatabaseJsonType["market_latest_state_event"] & {
    daily_volume: Uint128String;
    daily_base_volume: Uint128String;
  };
  [TableName.ProcessorStatus]: {
    processor: string;
    last_success_version: number;
    last_updated: PostgresTimestamp;
    last_transaction_timestamp: PostgresTimestamp;
  };
  [TableName.PriceFeed]: Flatten<
    DatabaseJsonType["market_state"] & {
      open_price_q64: Uint64String;
      close_price_q64: Uint64String;
    }
  >;
  [TableName.Candlesticks]: CandlestickData;
  [TableName.ArenaMeleeEvents]: Flatten<TransactionMetadata & ArenaMeleeEventData>;
  [TableName.ArenaEnterEvents]: Flatten<TransactionMetadata & ArenaEnterEventData>;
  [TableName.ArenaExitEvents]: Flatten<TransactionMetadata & ArenaExitEventData>;
  [TableName.ArenaSwapEvents]: Flatten<TransactionMetadata & ArenaSwapEventData>;
  [TableName.ArenaVaultBalanceUpdateEvents]: Flatten<
    TransactionMetadata & ArenaVaultBalanceUpdateEventData
  >;
  [TableName.ArenaPosition]: ArenaPositionData;
  [TableName.ArenaInfo]: ArenaInfoData;
  [TableName.ArenaCandlesticks]: ArenaCandlestickData;
  [TableName.ArenaLeaderboard]: ArenaLeaderboardData;
  [TableName.ArenaLeaderboardHistory]: ArenaLeaderboardHistoryData;
  [TableName.ArenaLeaderboardHistoryWithArenaInfo]: Flatten<ArenaLeaderboardHistoryWithArenaInfoData>;
  [DatabaseRpc.UserPools]: Flatten<
    TransactionMetadata &
      MarketAndStateMetadata &
      StateEventData &
      ProcessedFields &
      UserLPCoinBalance & { daily_volume: Uint128String }
  >;
  [DatabaseRpc.AggregateMarketState]: Flatten<{
    last_emojicoin_transaction_version: Uint64String;
    cumulative_chat_messages: Uint64String;
    cumulative_integrator_fees: Uint128String;
    cumulative_quote_volume: Uint128String;
    cumulative_swaps: Uint64String;
    fully_diluted_value: Uint128String;
    last_bump_time: PostgresTimestamp;
    market_cap: Uint128String;
    n_markets: Uint64String;
    nonce: Uint64String;
    total_quote_locked: Uint128String;
    total_value_locked: Uint128String;
    n_markets_in_bonding_curve: Uint64String;
    n_markets_post_bonding_curve: Uint64String;
    n_global_state_events: Uint64String;
    n_market_registration_events: Uint64String;
    n_swap_events: Uint64String;
    n_chat_events: Uint64String;
    n_liquidity_events: Uint64String;
  }>;
};

type Columns = DatabaseJsonType[TableName.GlobalStateEvents] &
  DatabaseJsonType[TableName.PeriodicStateEvents] &
  DatabaseJsonType[TableName.MarketRegistrationEvents] &
  DatabaseJsonType[TableName.SwapEvents] &
  DatabaseJsonType[TableName.LiquidityEvents] &
  DatabaseJsonType[TableName.ChatEvents] &
  DatabaseJsonType[TableName.MarketLatestStateEvent] &
  DatabaseJsonType[TableName.UserLiquidityPools] &
  DatabaseJsonType[TableName.MarketDailyVolume] &
  DatabaseJsonType[TableName.Market1MPeriodsInLastDay] &
  DatabaseJsonType[TableName.MarketState] &
  DatabaseJsonType[TableName.PriceFeed] &
  DatabaseJsonType[TableName.ProcessorStatus] &
  DatabaseJsonType[TableName.ArenaMeleeEvents] &
  DatabaseJsonType[TableName.ArenaEnterEvents] &
  DatabaseJsonType[TableName.ArenaExitEvents] &
  DatabaseJsonType[TableName.ArenaSwapEvents] &
  DatabaseJsonType[TableName.ArenaVaultBalanceUpdateEvents] &
  DatabaseJsonType[TableName.ArenaPosition] &
  DatabaseJsonType[TableName.ArenaInfo] &
  DatabaseJsonType[TableName.ArenaCandlesticks] &
  DatabaseJsonType[TableName.ArenaLeaderboard] &
  DatabaseJsonType[TableName.ArenaLeaderboardHistory] &
  DatabaseJsonType[TableName.ArenaLeaderboardHistoryWithArenaInfo] &
  DatabaseJsonType[DatabaseRpc.UserPools] &
  DatabaseJsonType[DatabaseRpc.AggregateMarketState];

export type AnyColumnName = keyof Columns;
