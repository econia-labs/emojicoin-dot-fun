import { hexToBytes } from "@noble/hashes/utils";
import {
  deriveEmojicoinPublisherAddress,
  type Uint64String,
  type AccountAddressString,
  type HexString,
} from "../../emojicoin_dot_fun";
import {
  type AnyNumberString,
  toCumulativeStats,
  toInstantaneousStats,
  toLastSwap,
  toReserves,
  type Types,
} from "../../types";
import {
  type WithEmitTime,
  type DatabaseDataTypes,
  type DatabaseType,
  postgresTimestampToMicroseconds,
  postgresTimestampToDate,
  TableName,
  type ProcessedFields,
  DatabaseRPC,
} from "./json-types";
import {
  type MarketEmojiData,
  type MarketSymbolEmojis,
  type SymbolEmoji,
  toMarketEmojiData,
} from "../../emoji_data";
import { toPeriod, toTrigger, type Period, type Trigger } from "../../const";

export type TransactionMetadata = {
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
  insertedAt: data.inserted_at ? postgresTimestampToDate(data.inserted_at) : new Date(0),
});

/// If received from postgres, symbol bytes come in as a hex string in the format "\\xabcd" where
/// "abcd" is the hex string.
/// If received from the broker, the symbolBytes will be deserialized as an array of values.
const deserializeSymbolBytes = (symbolBytes: HexString | Array<AnyNumberString>) =>
  Array.isArray(symbolBytes)
    ? new Uint8Array(symbolBytes.map(Number))
    : hexToBytes(symbolBytes.replace(/\\x/g, ""));

export type MarketMetadataModel = {
  marketID: bigint;
  time: bigint;
  marketNonce: bigint;
  trigger: Trigger;
  symbolEmojis: Array<SymbolEmoji>;
  marketAddress: AccountAddressString;
} & MarketEmojiData;

// To make things simpler, convert bumpTime and emitTime to `time`, and add the symbol data
// to the metadata.
const toMarketMetadataModel = (
  data:
    | DatabaseDataTypes["MarketAndStateMetadata"]
    | WithEmitTime<DatabaseDataTypes["MarketAndStateMetadata"]>
): MarketMetadataModel => {
  const symbolBytes = deserializeSymbolBytes(data.symbol_bytes);
  const marketAddress = deriveEmojicoinPublisherAddress({ emojis: data.symbol_emojis }).toString();

  return {
    marketID: BigInt(data.market_id),
    time: postgresTimestampToMicroseconds("bump_time" in data ? data.bump_time : data.emit_time),
    marketNonce: BigInt(data.market_nonce),
    trigger: toTrigger(data.trigger),
    symbolEmojis: data.symbol_emojis,
    marketAddress,
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
  tvlPerLPCoinGrowthQ64: bigint;
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
  tvlPerLPCoinGrowthQ64: BigInt(data.tvl_per_lp_coin_growth_q64),
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

export type StateEventData = {
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
export type UserPoolsRPCModel = ReturnType<typeof toUserPoolsRPCResponse>;

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
export const withMarketAndStateMetadataAndBumpTime = curryToNamedType(
  toMarketMetadataModel,
  "market"
);
export const withMarketAndStateMetadataAndEmitTime = curryToNamedType(
  toMarketMetadataModel,
  "market"
);
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
export const withLastSwapData = curryToNamedType(toLastSwapFromDatabase, "lastSwap");

const EVENT_NAMES = {
  GlobalState: "GlobalState",
  PeriodicState: "PeriodicState",
  MarketRegistration: "MarketRegistration",
  Swap: "Swap",
  Chat: "Chat",
  Liquidity: "Liquidity",
  State: "State",
} as const;

export type EventName = (typeof EVENT_NAMES)[keyof typeof EVENT_NAMES];

const formatEmojis = <
  T extends { symbol_emojis: MarketSymbolEmojis } | { symbolEmojis: MarketSymbolEmojis },
>(
  data: T
) => {
  if ("symbol_emojis" in data) {
    return `${data.symbol_emojis.join("")}` as const;
  }
  return `${data.symbolEmojis.join("")}` as const;
};

const getMarketNonce = <T extends { market_nonce: string } | { marketNonce: bigint }>(data: T) => {
  if ("market_nonce" in data) {
    return data.market_nonce;
  }
  return data.marketNonce;
};

export const GuidGetters = {
  globalStateEvent: (data: DatabaseType["global_state_events"] | GlobalStateEventData) => {
    const eventName = EVENT_NAMES.GlobalState;
    const registryNonce = "registry_nonce" in data ? data.registry_nonce : data.registryNonce;
    return {
      eventName,
      guid: `${eventName}::${registryNonce}` as const,
    };
  },
  periodicStateEvent: (
    data: DatabaseType["periodic_state_events"] | (MarketMetadataModel & { period: Period })
  ) => {
    const eventName = EVENT_NAMES.PeriodicState;
    const periodAndMarketNonce = `${toPeriod(data.period)}::${getMarketNonce(data)}` as const;
    return {
      eventName,
      guid: `${formatEmojis(data)}::${eventName}::${periodAndMarketNonce}` as const,
    };
  },
  marketRegistrationEvent: (
    data: DatabaseType["market_registration_events"] | MarketMetadataModel
  ) => ({
    eventName: EVENT_NAMES.MarketRegistration,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.MarketRegistration}` as const,
  }),
  swapEvent: (data: DatabaseType["swap_events"] | MarketMetadataModel) => ({
    eventName: EVENT_NAMES.Swap,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.Swap}::${getMarketNonce(data)}` as const,
  }),
  chatEvent: (data: DatabaseType["chat_events"] | MarketMetadataModel) => ({
    eventName: EVENT_NAMES.Chat,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.Chat}::${getMarketNonce(data)}` as const,
  }),
  liquidityEvent: (data: DatabaseType["liquidity_events"] | MarketMetadataModel) => ({
    eventName: EVENT_NAMES.Liquidity,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.Liquidity}::${getMarketNonce(data)}` as const,
  }),
  marketLatestStateEvent: <
    T extends DatabaseType["market_latest_state_event"] | MarketMetadataModel,
  >(
    data: T
  ) => ({
    eventName: EVENT_NAMES.State,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.State}::${getMarketNonce(data)}` as const,
  }),
};

export const toGlobalStateEventModel = (data: DatabaseType["global_state_events"]) => ({
  ...withTransactionMetadata(data),
  ...withGlobalStateEventData(data),
  ...GuidGetters.globalStateEvent(data),
});

export const toPeriodicStateEventModel = (data: DatabaseType["periodic_state_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndEmitTime(data),
  ...withLastSwap(data),
  ...withPeriodicStateMetadata(data),
  ...withPeriodicStateEventData(data),
  ...withLastSwapData(data),
  ...GuidGetters.periodicStateEvent(data),
});

export const toMarketRegistrationEventModel = (
  data: DatabaseType["market_registration_events"]
) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withMarketRegistrationEventData(data),
  ...GuidGetters.marketRegistrationEvent(data),
});

export const toSwapEventModel = (data: DatabaseType["swap_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withSwapEventData(data),
  ...withStateEventData(data),
  ...GuidGetters.swapEvent(data),
});

export const toChatEventModel = (data: DatabaseType["chat_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withChatEventData(data),
  ...withStateEventData(data),
  ...withLastSwapData(data),
  ...GuidGetters.chatEvent(data),
});

export const toLiquidityEventModel = (data: DatabaseType["liquidity_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withLiquidityEventData(data),
  ...withStateEventData(data),
  ...withLastSwapData(data),
  ...GuidGetters.liquidityEvent(data),
});

export const toProcessedData = (data: ProcessedFields) => ({
  dailyTvlPerLPCoinGrowthQ64: BigInt(data.daily_tvl_per_lp_coin_growth_q64),
  inBondingCurve: data.in_bonding_curve,
  volumeIn1MStateTracker: BigInt(data.volume_in_1m_state_tracker),
});

export const toMarketLatestStateEventModel = (data: DatabaseType["market_latest_state_event"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withStateEventData(data),
  ...withLastSwapData(data),
  ...toProcessedData(data),
  ...GuidGetters.marketLatestStateEvent(data),
});

export const toMarketState = (data: DatabaseType["market_state"]) => ({
  ...toMarketLatestStateEventModel(data),
  dailyVolume: BigInt(data.daily_volume),
});

export const toTransactionMetadataForUserLiquidityPools = (
  transaction: TransactionMetadata
): Omit<TransactionMetadata, "sender" | "entryFunction"> => ({
  time: transaction.time,
  version: transaction.version,
  timestamp: transaction.timestamp,
  insertedAt: transaction.insertedAt,
});

export const withLPCoinBalance = <T extends { lp_coin_balance: Uint64String }>(data: T) => ({
  lpCoinBalance: BigInt(data.lp_coin_balance),
});

export const toUserLiquidityPoolsModel = (data: DatabaseType["user_liquidity_pools"]) => {
  const { transaction: withExtraFields } = withTransactionMetadata({
    ...data,
    sender: "0x",
    entry_function: "",
  });

  const transaction = toTransactionMetadataForUserLiquidityPools(withExtraFields);

  return {
    transaction,
    ...withMarketAndStateMetadataAndEmitTime(data),
    ...withLiquidityEventData(data),
    ...withLPCoinBalance(data),
  };
};

export const toMarketDailyVolumeModel = (data: DatabaseType["market_daily_volume"]) => ({
  marketID: BigInt(data.market_id),
  dailyVolume: BigInt(data.daily_volume),
});

export const toMarket1MPeriodsInLastDay = (
  data: DatabaseType["market_1m_periods_in_last_day"]
) => ({
  marketID: BigInt(data.market_id),
  transactionVersion: BigInt(data.transaction_version),
  insertedAt: data.inserted_at ? postgresTimestampToDate(data.inserted_at) : new Date(0),
  nonce: BigInt(data.nonce),
  volume: BigInt(data.volume),
  startTime: data.start_time,
});

export const toProcessorStatus = (data: DatabaseType["processor_status"]) => ({
  lastProcessedTimestamp: data.last_processed_timestamp,
});

export const toUserPoolsRPCResponse = (data: DatabaseType["user_pools"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withStateEventData(data),
  ...toProcessedData(data),
  ...withLPCoinBalance(data),
});

export const DatabaseTypeConverter = {
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
  [DatabaseRPC.UserPools]: toUserPoolsRPCResponse,
};

export type DatabaseModels = {
  [TableName.GlobalStateEvents]: GlobalStateEventModel;
  [TableName.PeriodicStateEvents]: PeriodicStateEventModel;
  [TableName.MarketRegistrationEvents]: MarketRegistrationEventModel;
  [TableName.SwapEvents]: SwapEventModel;
  [TableName.ChatEvents]: ChatEventModel;
  [TableName.LiquidityEvents]: LiquidityEventModel;
  [TableName.MarketLatestStateEvent]: MarketLatestStateEventModel;
  [TableName.UserLiquidityPools]: UserLiquidityPoolsModel;
  [TableName.MarketDailyVolume]: MarketDailyVolumeModel;
  [TableName.Market1MPeriodsInLastDay]: Market1MPeriodsInLastDayModel;
  [TableName.MarketState]: MarketStateModel;
  [TableName.ProcessorStatus]: ProcessorStatusModel;
  [DatabaseRPC.UserPools]: UserPoolsRPCModel;
};

export type AnyEventTable =
  | TableName.SwapEvents
  | TableName.ChatEvents
  | TableName.MarketRegistrationEvents
  | TableName.PeriodicStateEvents
  | TableName.MarketLatestStateEvent
  | TableName.LiquidityEvents
  | TableName.GlobalStateEvents;

export type AnyEventModel =
  | DatabaseModels[TableName.SwapEvents]
  | DatabaseModels[TableName.ChatEvents]
  | DatabaseModels[TableName.MarketRegistrationEvents]
  | DatabaseModels[TableName.PeriodicStateEvents]
  | DatabaseModels[TableName.MarketLatestStateEvent]
  | DatabaseModels[TableName.LiquidityEvents]
  | DatabaseModels[TableName.GlobalStateEvents];

export type EventModelWithMarket =
  | DatabaseModels[TableName.SwapEvents]
  | DatabaseModels[TableName.ChatEvents]
  | DatabaseModels[TableName.MarketRegistrationEvents]
  | DatabaseModels[TableName.PeriodicStateEvents]
  | DatabaseModels[TableName.MarketLatestStateEvent]
  | DatabaseModels[TableName.LiquidityEvents];

const extractEventType = (guid: string) => {
  const match = guid.match(/^.*::(\w+)::/u);
  return match ? match[1] : null;
};

const eventTypeMatches = (
  guid: ReturnType<(typeof GuidGetters)[keyof typeof GuidGetters]>["guid"],
  eventType: EventName
) => extractEventType(guid) === eventType;

export const isSwapEventModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.SwapEvents] => eventTypeMatches(data.guid, "Swap");
export const isChatEventModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.ChatEvents] => eventTypeMatches(data.guid, "Chat");
export const isMarketRegistrationEventModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.MarketRegistrationEvents] =>
  eventTypeMatches(data.guid, "MarketRegistration");
export const isPeriodicStateEventModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.PeriodicStateEvents] =>
  eventTypeMatches(data.guid, "PeriodicState");
export const isMarketLatestStateEventModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.MarketLatestStateEvent] => eventTypeMatches(data.guid, "State");
export const isMarketStateModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.MarketState] =>
  isMarketLatestStateEventModel(data) && "dailyVolume" in data;
export const isLiquidityEventModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.LiquidityEvents] => eventTypeMatches(data.guid, "Liquidity");
export const isGlobalStateEventModel = (
  data: AnyEventModel
): data is DatabaseModels[TableName.GlobalStateEvents] =>
  eventTypeMatches(data.guid, "GlobalState");

export const isEventModelWithMarket = (data: AnyEventModel): data is EventModelWithMarket =>
  !isGlobalStateEventModel(data);
