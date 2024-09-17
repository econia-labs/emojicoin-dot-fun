import { hexToBytes } from "@noble/hashes/utils";
import { type AccountAddressString, type HexString } from "../../emojicoin_dot_fun";
import {
  type Flatten,
  toCumulativeStats,
  toInstantaneousStats,
  toLastSwap,
  toReserves,
  type Types,
} from "../../types";
import {
  type WithEmitTime,
  type DatabaseDataTypes,
  type DatabaseRow,
  postgresTimestampToMicroseconds,
  postgresTimestampToDate,
  TableName,
} from "./snake-case-types";
import { toMarketEmojiData } from "../../emoji_data";
import { toPeriod, toTrigger, type Period, type Trigger } from "../../const";

type TransactionMetadata = {
  version: bigint;
  sender: AccountAddressString;
  entryFunction?: string | null;
  time: bigint;
  timestamp: Date;
  insertedAt: Date;
};

const toTransactionMetadata = (
  data: DatabaseDataTypes["TransactionMetadata"]
): TransactionMetadata => ({
  version: BigInt(data.transaction_version),
  sender: data.sender,
  entryFunction: data.entry_function,
  // The number of microseconds since the Unix epoch.
  time: postgresTimestampToMicroseconds(data.transaction_timestamp),
  // Note that we lose microsecond precision on the two `Date` fields; they're intended to be used
  // for bookkeeping and debug logs.
  timestamp: postgresTimestampToDate(data.transaction_timestamp),
  insertedAt: postgresTimestampToDate(data.inserted_at),
});

/// `SymbolBytes` come in as a hex string in the format "\\xabcd" where "abcd" is the hex string.
const deserializePostgresHexString = (symbolBytes: HexString) =>
  hexToBytes(symbolBytes.replace(/\\x/g, ""));

type MarketAndStateMetadata = {
  marketID: bigint;
  symbolBytes: Uint8Array;
  symbolEmojis: string[];
  bumpTime: Date;
  marketNonce: bigint;
  trigger: Trigger;
};

// To make things simpler, convert bumpTime and emitTime to `time`, and add the symbol data
// to the metadata.
const toMetadata = (
  data:
    | DatabaseDataTypes["MarketAndStateMetadata"]
    | WithEmitTime<DatabaseDataTypes["MarketAndStateMetadata"]>
) => {
  const symbolBytes = deserializePostgresHexString(data.symbol_bytes);

  return {
    marketID: BigInt(data.market_id),
    time: postgresTimestampToMicroseconds("bump_time" in data ? data.bump_time : data.emit_time),
    marketNonce: BigInt(data.market_nonce),
    trigger: toTrigger(data.trigger),
    ...toMarketEmojiData(symbolBytes),
  };
};

const toLastSwapFromDatabase = (data: DatabaseDataTypes["LastSwapData"]): Types.LastSwap =>
  toLastSwap({
    is_sell: data.last_swap_is_sell,
    avg_execution_price_q64: data.last_swap_avg_execution_price_q64,
    base_volume: data.last_swap_base_volume,
    quote_volume: data.last_swap_quote_volume,
    nonce: data.last_swap_nonce,
    time: postgresTimestampToMicroseconds(data.last_swap_time).toString(),
  });

type GlobalStateEventData = {
  emitTime: bigint;
  registryNonce: bigint;
  trigger: Trigger;
  cumulativeQuoteVolume: bigint;
  totalQuoteLocked: bigint;
  totalValueLocked: bigint;
  marketCap: bigint;
  fullyDilutedValue: bigint;
  cumulativeIntegratorFees: bigint;
  cumulativeSwaps: bigint;
  cumulativeChatMessages: bigint;
};

const toGlobalStateEventData = (
  data: DatabaseDataTypes["GlobalStateEventData"]
): GlobalStateEventData => ({
  emitTime: postgresTimestampToMicroseconds(data.emit_time),
  registryNonce: BigInt(data.registry_nonce),
  trigger: toTrigger(data.trigger),
  cumulativeQuoteVolume: BigInt(data.cumulative_quote_volume),
  totalQuoteLocked: BigInt(data.total_quote_locked),
  totalValueLocked: BigInt(data.total_value_locked),
  marketCap: BigInt(data.market_cap),
  fullyDilutedValue: BigInt(data.fully_diluted_value),
  cumulativeIntegratorFees: BigInt(data.cumulative_integrator_fees),
  cumulativeSwaps: BigInt(data.cumulative_swaps),
  cumulativeChatMessages: BigInt(data.cumulative_chat_messages),
});

type PeriodicStateMetadata = {
  period: Period;
  startTime: bigint;
};

const toPeriodicStateMetadata = (
  data: DatabaseDataTypes["PeriodicStateMetadata"]
): PeriodicStateMetadata => ({
  period: toPeriod(data.period),
  startTime: postgresTimestampToMicroseconds(data.start_time),
});

type PeriodicStateEventData = {
  openPriceQ64: bigint;
  highPriceQ64: bigint;
  lowPriceQ64: bigint;
  closePriceQ64: bigint;
  volumeBase: bigint;
  volumeQuote: bigint;
  integratorFees: bigint;
  poolFeesBase: bigint;
  poolFeesQuote: bigint;
  numSwaps: bigint;
  numChatMessages: bigint;
  startsInBondingCurve: boolean;
  endsInBondingCurve: boolean;
  tvlPerLpCoinGrowthQ64: bigint;
};

const toPeriodicStateEventData = (
  data: DatabaseDataTypes["PeriodicStateEventData"]
): PeriodicStateEventData => ({
  openPriceQ64: BigInt(data.open_price_q64),
  highPriceQ64: BigInt(data.high_price_q64),
  lowPriceQ64: BigInt(data.low_price_q64),
  closePriceQ64: BigInt(data.close_price_q64),
  volumeBase: BigInt(data.volume_base),
  volumeQuote: BigInt(data.volume_quote),
  integratorFees: BigInt(data.integrator_fees),
  poolFeesBase: BigInt(data.pool_fees_base),
  poolFeesQuote: BigInt(data.pool_fees_quote),
  numSwaps: BigInt(data.n_swaps),
  numChatMessages: BigInt(data.n_chat_messages),
  startsInBondingCurve: data.starts_in_bonding_curve,
  endsInBondingCurve: data.ends_in_bonding_curve,
  tvlPerLpCoinGrowthQ64: BigInt(data.tvl_per_lp_coin_growth_q64),
});

type MarketRegistrationEventData = {
  registrant: AccountAddressString;
  integrator: AccountAddressString;
  integratorFee: bigint;
};

const toMarketRegistrationEventData = (
  data: DatabaseDataTypes["MarketRegistrationEventData"]
): MarketRegistrationEventData => ({
  registrant: data.registrant,
  integrator: data.integrator,
  integratorFee: BigInt(data.integrator_fee),
});

type SwapEventData = {
  swapper: AccountAddressString;
  integrator: AccountAddressString;
  integratorFee: bigint;
  inputAmount: bigint;
  isSell: boolean;
  integratorFeeRateBPs: number;
  netProceeds: bigint;
  baseVolume: bigint;
  quoteVolume: bigint;
  avgExecutionPriceQ64: bigint;
  poolFee: bigint;
  startsInBondingCurve: boolean;
  resultsInStateTransition: boolean;
  balanceAsFractionOfCirculatingSupplyBeforeQ64: bigint;
  balanceAsFractionOfCirculatingSupplyAfterQ64: bigint;
};

const toSwapEventData = (data: DatabaseDataTypes["SwapEventData"]): SwapEventData => ({
  swapper: data.swapper,
  integrator: data.integrator,
  integratorFee: BigInt(data.integrator_fee),
  inputAmount: BigInt(data.input_amount),
  isSell: data.is_sell,
  integratorFeeRateBPs: Number(data.integrator_fee_rate_bps),
  netProceeds: BigInt(data.net_proceeds),
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  avgExecutionPriceQ64: BigInt(data.avg_execution_price_q64),
  poolFee: BigInt(data.pool_fee),
  startsInBondingCurve: data.starts_in_bonding_curve,
  resultsInStateTransition: data.results_in_state_transition,
  balanceAsFractionOfCirculatingSupplyBeforeQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_before_q64
  ),
  balanceAsFractionOfCirculatingSupplyAfterQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_after_q64
  ),
});

type LiquidityEventData = {
  provider: AccountAddressString;
  baseAmount: bigint;
  quoteAmount: bigint;
  lpCoinAmount: bigint;
  liquidityProvided: boolean;
  baseDonationClaimAmount: bigint;
  quoteDonationClaimAmount: bigint;
};

const toLiquidityEventData = (
  data: DatabaseDataTypes["LiquidityEventData"]
): LiquidityEventData => ({
  provider: data.provider,
  baseAmount: BigInt(data.base_amount),
  quoteAmount: BigInt(data.quote_amount),
  lpCoinAmount: BigInt(data.lp_coin_amount),
  liquidityProvided: data.liquidity_provided,
  baseDonationClaimAmount: BigInt(data.base_donation_claim_amount),
  quoteDonationClaimAmount: BigInt(data.quote_donation_claim_amount),
});

type ChatEventData = {
  user: AccountAddressString;
  message: string;
  userEmojicoinBalance: bigint;
  circulatingSupply: bigint;
  balanceAsFractionOfCirculatingSupplyQ64: bigint;
};

const toChatEventData = (data: DatabaseDataTypes["ChatEventData"]): ChatEventData => ({
  user: data.user,
  message: data.message,
  userEmojicoinBalance: BigInt(data.user_emojicoin_balance),
  circulatingSupply: BigInt(data.circulating_supply),
  balanceAsFractionOfCirculatingSupplyQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_q64
  ),
});

type StateEventData = {
  clammVirtualReserves: Types.Reserves;
  cpammRealReserves: Types.Reserves;
  lpCoinSupply: bigint;
  cumulativeStats: Types.CumulativeStats;
  instantaneousStats: Types.InstantaneousStats;
};

const toStateEventData = (data: DatabaseDataTypes["StateEventData"]): StateEventData => ({
  clammVirtualReserves: toReserves({
    base: data.clamm_virtual_reserves_base,
    quote: data.clamm_virtual_reserves_quote,
  }),
  cpammRealReserves: toReserves({
    base: data.cpamm_real_reserves_base,
    quote: data.cpamm_real_reserves_quote,
  }),
  lpCoinSupply: BigInt(data.lp_coin_supply),
  cumulativeStats: toCumulativeStats({
    base_volume: data.cumulative_stats_base_volume,
    quote_volume: data.cumulative_stats_quote_volume,
    integrator_fees: data.cumulative_stats_integrator_fees,
    pool_fees_base: data.cumulative_stats_pool_fees_base,
    pool_fees_quote: data.cumulative_stats_pool_fees_quote,
    n_swaps: data.cumulative_stats_n_swaps,
    n_chat_messages: data.cumulative_stats_n_chat_messages,
  }),
  instantaneousStats: toInstantaneousStats({
    total_quote_locked: data.instantaneous_stats_total_quote_locked,
    total_value_locked: data.instantaneous_stats_total_value_locked,
    market_cap: data.instantaneous_stats_market_cap,
    fully_diluted_value: data.instantaneous_stats_fully_diluted_value,
  }),
});

export type DenormalizedDatabaseModels = {
  GlobalStateEventModel: Flatten<TransactionMetadata & GlobalStateEventData>;
  PeriodicStateEventModel: Flatten<
    TransactionMetadata &
      MarketAndStateMetadata &
      Types.LastSwap &
      PeriodicStateMetadata &
      PeriodicStateEventData
  >;
  MarketRegistrationEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & MarketRegistrationEventData
  >;
  SwapEventModel: Flatten<
    TransactionMetadata & MarketAndStateMetadata & Types.LastSwap & SwapEventData & StateEventData
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
        dailyTvlPerLPCoinGrowthQ64: bigint;
        inBondingCurve: boolean;
        volumeIn1MStateTracker: bigint;
      }
  >;
  UserLiquidityPoolsModel: Flatten<
    {
      transactionVersion: bigint;
      time: bigint;
      transactionTimestamp: Date;
      insertedAt: Date;
    } & Omit<MarketAndStateMetadata, "emitTime"> & { bumpTime: Date } & LiquidityEventData
  >;
  MarketDailyVolumeModel: Flatten<{
    marketID: bigint;
    dailyVolume: bigint;
  }>;
  Market1MPeriodsInLastDay: Flatten<{
    marketID: bigint;
    transactionVersion: bigint;
    insertedAt: Date;
    nonce: bigint;
    volume: bigint;
    startTime: bigint;
  }>;
};

export type GlobalStateEventModel = ReturnType<typeof toGlobalStateEventModel>;
export type PeriodicStateEventModel = ReturnType<typeof toPeriodicStateEventModel>;
export type MarketRegistrationEventModel = ReturnType<typeof toMarketRegistrationEventModel>;
export type SwapEventModel = ReturnType<typeof toSwapEventModel>;
export type ChatEventModel = ReturnType<typeof toChatEventModel>;
export type LiquidityEventModel = ReturnType<typeof toLiquidityEventModel>;
export type MarketLatestStateEventModel = ReturnType<typeof toMarketLatestStateEventModel>;
export type UserLiquidityPoolsModel = ReturnType<typeof toUserLiquidityPoolsModel>;
export type MarketDailyVolumeModel = ReturnType<typeof toMarketDailyVolumeModel>;
export type Market1MPeriodsInLastDayModel = ReturnType<typeof toMarket1MPeriodsInLastDay>;
export type MarketStateModel = ReturnType<typeof toMarketState>;
export type ProcessorStatusModel = ReturnType<typeof toProcessorStatus>;

/**
 * Converts a function that converts a type to another type into a function that converts the type
 * to an object with a single key.
 *
 * We do this for the database Model conversion functions.
 *
 * See the example for a better understanding.
 * @example
 * ```ts
 * const toBigInt = (data: string) => BigInt(data);
 * const toNamedBigInt = curryToNamedType(toBigInt, "bigInt");
 * const data = "123";
 * const result = toNamedBigInt(data);
 *
 * assert!(result.bigInt === 123n);
 * ```
 */
const curryToNamedType =
  <T, U, K extends string>(to: (data: T) => U, name: K) =>
  (data: T): { [P in K]: U } =>
    ({ [name]: to(data) }) as { [P in K]: U };

export const withTransactionMetadata = curryToNamedType(toTransactionMetadata, "transaction");
export const withMarketAndStateMetadataAndBumpTime = curryToNamedType(toMetadata, "market");
export const withMarketAndStateMetadataAndEmitTime = curryToNamedType(toMetadata, "market");
export const withLastSwap = curryToNamedType(toLastSwapFromDatabase, "lastSwap");
export const withGlobalStateEventData = curryToNamedType(toGlobalStateEventData, "globalState");
export const withPeriodicStateMetadata = curryToNamedType(
  toPeriodicStateMetadata,
  "periodicMetadata"
);
export const withPeriodicStateEventData = curryToNamedType(
  toPeriodicStateEventData,
  "periodicState"
);
export const withMarketRegistrationEventData = curryToNamedType(
  toMarketRegistrationEventData,
  "marketRegistration"
);
export const withSwapEventData = curryToNamedType(toSwapEventData, "swap");
export const withChatEventData = curryToNamedType(toChatEventData, "chat");
export const withLiquidityEventData = curryToNamedType(toLiquidityEventData, "liquidity");
export const withStateEventData = curryToNamedType(toStateEventData, "state");

export const toGlobalStateEventModel = (data: DatabaseRow["GlobalStateEventModel"]) => ({
  ...withTransactionMetadata(data),
  ...withGlobalStateEventData(data),
});

export const toPeriodicStateEventModel = (data: DatabaseRow["PeriodicStateEventModel"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndEmitTime(data),
  ...withLastSwap(data),
  ...withPeriodicStateMetadata(data),
  ...withPeriodicStateEventData(data),
});

export const toMarketRegistrationEventModel = (
  data: DatabaseRow["MarketRegistrationEventModel"]
) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withMarketRegistrationEventData(data),
});

export const toSwapEventModel = (data: DatabaseRow["SwapEventModel"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withSwapEventData(data),
  ...withStateEventData(data),
});

export const toChatEventModel = (data: DatabaseRow["ChatEventModel"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withChatEventData(data),
  ...withStateEventData(data),
});

export const toLiquidityEventModel = (data: DatabaseRow["LiquidityEventModel"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withLiquidityEventData(data),
  ...withStateEventData(data),
});

export const toMarketLatestStateEventModel = (
  data: DatabaseRow["MarketLatestStateEventModel"]
) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withStateEventData(data),
  dailyTvlPerLPCoinGrowthQ64: BigInt(data.daily_tvl_per_lp_coin_growth_q64),
  inBondingCurve: data.in_bonding_curve,
  volumeIn1MStateTracker: BigInt(data.volume_in_1m_state_tracker),
});

export const toMarketState = (data: DatabaseRow["MarketStateModel"]) => ({
  ...toMarketLatestStateEventModel(data),
  dailyVolume: BigInt(data.daily_volume),
});

export const toUserLiquidityPoolsModel = (data: DatabaseRow["UserLiquidityPoolsModel"]) => ({
  transactionVersion: BigInt(data.transaction_version),
  transactionTimestamp: data.transaction_timestamp,
  insertedAt: data.inserted_at,
  marketID: BigInt(data.market_id),
  symbolBytes: deserializePostgresHexString(data.symbol_bytes),
  emitTime: data.emit_time,
  marketNonce: BigInt(data.market_nonce),
  trigger: toTrigger(data.trigger),
  ...withLiquidityEventData(data),
});

export const toMarketDailyVolumeModel = (data: DatabaseRow["MarketDailyVolumeModel"]) => ({
  marketID: BigInt(data.market_id),
  dailyVolume: BigInt(data.daily_volume),
});

export const toMarket1MPeriodsInLastDay = (data: DatabaseRow["Market1MPeriodsInLastDayModel"]) => ({
  marketID: BigInt(data.market_id),
  transactionVersion: BigInt(data.transaction_version),
  insertedAt: data.inserted_at,
  nonce: BigInt(data.nonce),
  volume: BigInt(data.volume),
  startTime: data.start_time,
});

export const toProcessorStatus = (data: DatabaseRow["ProcessorStatusModel"]) => ({
  lastProcessedTimestamp: data.last_processed_timestamp,
});

export const TableConverter = {
  [TableName.GlobalStateEvents]: toGlobalStateEventModel,
  [TableName.PeriodicStateEvents]: toPeriodicStateEventModel,
  [TableName.MarketRegistrationEvents]: toMarketRegistrationEventModel,
  [TableName.SwapEvents]: toSwapEventModel,
  [TableName.ChatEvents]: toChatEventModel,
  [TableName.LiquidityEvents]: toLiquidityEventModel,
  [TableName.MarketLatestStateEvent]: toMarketLatestStateEventModel,
  [TableName.UserLiquidityPools]: toUserLiquidityPoolsModel,
  [TableName.MarketDailyVolume]: toMarketDailyVolumeModel,
  [TableName.Market1MPeriodsInLastDay]: toMarket1MPeriodsInLastDay,
  [TableName.MarketState]: toMarketState,
  [TableName.ProcessorStatus]: toProcessorStatus,
};
