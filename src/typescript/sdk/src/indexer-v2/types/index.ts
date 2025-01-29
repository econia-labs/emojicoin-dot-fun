import { hexToBytes } from "@noble/hashes/utils";
import {
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
  type DatabaseStructType,
  type DatabaseJsonType,
  postgresTimestampToMicroseconds,
  postgresTimestampToDate,
  TableName,
  type ProcessedFields,
  DatabaseRpc,
  type BlockAndEventIndexMetadata,
} from "./json-types";
import { type MarketEmojiData, type SymbolEmoji, toMarketEmojiData } from "../../emoji_data";
import { toPeriod, toTrigger, type Period, type Trigger } from "../../const";
import { toAccountAddressString } from "../../utils";
import Big from "big.js";
import { q64ToBig } from "../../utils/nominal-price";

export type TransactionMetadata = {
  version: bigint;
  sender: AccountAddressString;
  entryFunction?: string | null;
  time: bigint;
  timestamp: Date;
  insertedAt: Date;
};

const toTransactionMetadata = (
  data: DatabaseStructType["TransactionMetadata"]
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

const toBlockAndEventIndex = (data: BlockAndEventIndexMetadata) =>
  data && data.block_number
    ? {
        blockNumber: BigInt(data.block_number),
        eventIndex: BigInt(data.event_index),
      }
    : undefined;

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
    | DatabaseStructType["MarketAndStateMetadata"]
    | WithEmitTime<DatabaseStructType["MarketAndStateMetadata"]>
): MarketMetadataModel => {
  const symbolBytes = deserializeSymbolBytes(data.symbol_bytes);

  return {
    marketID: BigInt(data.market_id),
    time: postgresTimestampToMicroseconds("bump_time" in data ? data.bump_time : data.emit_time),
    marketNonce: BigInt(data.market_nonce),
    trigger: toTrigger(data.trigger),
    symbolEmojis: data.symbol_emojis,
    marketAddress: toAccountAddressString(data.market_address),
    ...toMarketEmojiData(symbolBytes),
  };
};

const toLastSwapFromDatabase = (data: DatabaseStructType["LastSwapData"]): Types["LastSwap"] =>
  toLastSwap({
    is_sell: data.last_swap_is_sell,
    avg_execution_price_q64: data.last_swap_avg_execution_price_q64,
    base_volume: data.last_swap_base_volume,
    quote_volume: data.last_swap_quote_volume,
    nonce: data.last_swap_nonce,
    time: postgresTimestampToMicroseconds(data.last_swap_time).toString(),
  });

const toArenaMeleeFromDatabase = (data: DatabaseStructType["ArenaMelee"]): Types["ArenaMelee"] => ({
  meleeId: BigInt(data.melee_id),
  emojicoin0MarketAddress: data.emojicoin_0_market_address,
  emojicoin1MarketAddress: data.emojicoin_1_market_address,
  startTime: BigInt(data.start_time),
  duration: BigInt(data.duration),
  maxMatchPercentage: BigInt(data.max_match_percentage),
  maxMatchAmount: BigInt(data.max_match_amount),
  availableRewards: BigInt(data.available_rewards),
});

const toArenaEnterFromDatabase = (data: DatabaseStructType["ArenaEnter"]): Types["ArenaEnter"] => ({
  meleeId: BigInt(data.melee_id),
  user: data.user,
  inputAmount: BigInt(data.input_amount),
  quoteVolume: BigInt(data.quote_volume),
  integratorFee: BigInt(data.integrator_fee),
  matchAmount: BigInt(data.match_amount),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  emojicoin0ExchangeRateBase: BigInt(data.emojicoin_0_exchange_rate_base),
  emojicoin0ExchangeRateQuote: BigInt(data.emojicoin_0_exchange_rate_quote),
  emojicoin1ExchangeRateBase: BigInt(data.emojicoin_1_exchange_rate_base),
  emojicoin1ExchangeRateQuote: BigInt(data.emojicoin_1_exchange_rate_quote),
});

const toArenaExitFromDatabase = (data: DatabaseStructType["ArenaExit"]): Types["ArenaExit"] => ({
  meleeId: BigInt(data.melee_id),
  user: data.user,
  tapOutFee: BigInt(data.tap_out_fee),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  emojicoin0ExchangeRateBase: BigInt(data.emojicoin_0_exchange_rate_base),
  emojicoin0ExchangeRateQuote: BigInt(data.emojicoin_0_exchange_rate_quote),
  emojicoin1ExchangeRateBase: BigInt(data.emojicoin_1_exchange_rate_base),
  emojicoin1ExchangeRateQuote: BigInt(data.emojicoin_1_exchange_rate_quote),
});

const toArenaSwapFromDatabase = (data: DatabaseStructType["ArenaSwap"]): Types["ArenaSwap"] => ({
  meleeId: BigInt(data.melee_id),
  user: data.user,
  quoteVolume: BigInt(data.quote_volume),
  integratorFee: BigInt(data.integrator_fee),
  emojicoin0Proceeds: BigInt(data.emojicoin_0_proceeds),
  emojicoin1Proceeds: BigInt(data.emojicoin_1_proceeds),
  emojicoin0ExchangeRateBase: BigInt(data.emojicoin_0_exchange_rate_base),
  emojicoin0ExchangeRateQuote: BigInt(data.emojicoin_0_exchange_rate_quote),
  emojicoin1ExchangeRateBase: BigInt(data.emojicoin_1_exchange_rate_base),
  emojicoin1ExchangeRateQuote: BigInt(data.emojicoin_1_exchange_rate_quote),
});

const toArenaVaultBalanceUpdateFromDatabase = (
  data: DatabaseStructType["ArenaVaultBalanceUpdate"]
): Types["ArenaVaultBalanceUpdate"] => ({
  newBalance: BigInt(data.new_balance),
});

const toArenaPositionsFromDatabase = (
  data: DatabaseStructType["ArenaPositions"]
): Types["ArenaPositions"] => ({
  user: data.user,
  meleeId: BigInt(data.melee_id),
  open: data.open,
  emojicoin0Balance: BigInt(data.emojicoin_0_balance),
  emojicoin1Balance: BigInt(data.emojicoin_1_balance),
  withdrawals: BigInt(data.withdrawals),
  deposits: BigInt(data.deposits),
});

const toArenaLeaderboardFromDatabase = (
  data: DatabaseStructType["ArenaLeaderboard"]
): Types["ArenaLeaderboard"] => ({
  user: data.user,
  open: data.open,
  emojicoin0Balance: BigInt(data.emojicoin_0_balance),
  emojicoin1Balance: BigInt(data.emojicoin_1_balance),
  profits: BigInt(data.profits),
  losses: BigInt(data.losses),
  pnl_percent: data.pnl_percent,
  pnl_octas: data.pnl_octas,
});

const toArenaInfoFromDatabase = (data: DatabaseStructType["ArenaInfo"]): Types["ArenaInfo"] => ({
  meleeId: BigInt(data.melee_id),
  volume: BigInt(data.volume),
  rewardsRemaining: BigInt(data.rewards_remaining),
  aptLocked: BigInt(data.apt_locked),
  emojicoin0MarketAddress: data.emojicoin_0_market_address,
  emojicoin1MarketAddress: data.emojicoin_1_market_address,
  startTime: BigInt(data.start_time),
  duration: BigInt(data.duration),
  maxMatchPercentage: BigInt(data.max_match_percentage),
  maxMatchAmount: BigInt(data.max_match_amount),
});

const toArenaLeaderboardHistoryFromDatabase = (
  data: DatabaseStructType["ArenaLeaderboardHistory"]
): Types["ArenaLeaderboardHistory"] => ({
  user: toAccountAddressString(data.user),
  meleeId: BigInt(data.melee_id),
  profits: BigInt(data.profits),
  losses: BigInt(data.losses),
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
  data: DatabaseStructType["GlobalStateEventData"]
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
  data: DatabaseStructType["PeriodicStateMetadata"]
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
  data: DatabaseStructType["PeriodicStateEventData"]
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
  data: DatabaseStructType["MarketRegistrationEventData"]
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

const toSwapEventData = (data: DatabaseStructType["SwapEventData"]): SwapEventData => ({
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
  data: DatabaseStructType["LiquidityEventData"]
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

const toChatEventData = (data: DatabaseStructType["ChatEventData"]): ChatEventData => ({
  user: data.user,
  message: data.message,
  userEmojicoinBalance: BigInt(data.user_emojicoin_balance),
  circulatingSupply: BigInt(data.circulating_supply),
  balanceAsFractionOfCirculatingSupplyQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_q64
  ),
});

export type StateEventData = {
  clammVirtualReserves: Types["Reserves"];
  cpammRealReserves: Types["Reserves"];
  lpCoinSupply: bigint;
  cumulativeStats: Types["CumulativeStats"];
  instantaneousStats: Types["InstantaneousStats"];
};

const toStateEventData = (data: DatabaseStructType["StateEventData"]): StateEventData => ({
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
export type MarketStateModel = ReturnType<typeof toMarketStateModel>;
export type ProcessorStatusModel = ReturnType<typeof toProcessorStatus>;
export type PriceFeedModel = ReturnType<typeof toPriceFeed>;
export type ArenaMeleeModel = ReturnType<typeof toArenaMeleeModel>;
export type ArenaEnterModel = ReturnType<typeof toArenaEnterModel>;
export type ArenaExitModel = ReturnType<typeof toArenaExitModel>;
export type ArenaSwapModel = ReturnType<typeof toArenaSwapModel>;
export type ArenaVaultBalanceUpdateModel = ReturnType<typeof toArenaVaultBalanceUpdateModel>;
export type ArenaPositionsModel = ReturnType<typeof toArenaPositionsModel>;
export type ArenaLeaderboardModel = ReturnType<typeof toArenaLeaderboardModel>;
export type ArenaLeaderboardHistoryModel = ReturnType<typeof toArenaLeaderboardHistoryModel>;
export type ArenaInfoModel = ReturnType<typeof toArenaInfoModel>;
export type UserPoolsRPCModel = ReturnType<typeof toUserPoolsRPCResponse>;
export type AggregateMarketStateModel = ReturnType<typeof toAggregateMarketState>;

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
/// The `blockAndEvent` field is only set when fetched from the DB- otherwise it's `undefined`.
export const withBlockAndEventIndex = curryToNamedType(toBlockAndEventIndex, "blockAndEvent");
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
export const withArenaMeleeData = curryToNamedType(toArenaMeleeFromDatabase, "arenaMelee");
export const withArenaEnterData = curryToNamedType(toArenaEnterFromDatabase, "arenaEnter");
export const withArenaExitData = curryToNamedType(toArenaExitFromDatabase, "arenaExit");
export const withArenaSwapData = curryToNamedType(toArenaSwapFromDatabase, "arenaSwap");
export const withArenaVaultBalanceUpdateData = curryToNamedType(
  toArenaVaultBalanceUpdateFromDatabase,
  "arenaVaultBalanceUpdate"
);

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

const formatEmojis = <T extends { symbol_emojis: SymbolEmoji[] } | { symbolEmojis: SymbolEmoji[] }>(
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
  globalStateEvent: (data: DatabaseJsonType["global_state_events"] | GlobalStateEventData) => {
    const eventName = EVENT_NAMES.GlobalState;
    const registryNonce = "registry_nonce" in data ? data.registry_nonce : data.registryNonce;
    return {
      eventName,
      guid: `${eventName}::${registryNonce}::` as const,
    };
  },
  periodicStateEvent: (
    data: DatabaseJsonType["periodic_state_events"] | (MarketMetadataModel & { period: Period })
  ) => {
    const eventName = EVENT_NAMES.PeriodicState;
    const periodAndMarketNonce = `${toPeriod(data.period)}::${getMarketNonce(data)}` as const;
    return {
      eventName,
      guid: `${formatEmojis(data)}::${eventName}::${periodAndMarketNonce}` as const,
    };
  },
  marketRegistrationEvent: (
    data: DatabaseJsonType["market_registration_events"] | MarketMetadataModel
  ) => ({
    eventName: EVENT_NAMES.MarketRegistration,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.MarketRegistration}::` as const,
  }),
  swapEvent: (data: DatabaseJsonType["swap_events"] | MarketMetadataModel) => ({
    eventName: EVENT_NAMES.Swap,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.Swap}::${getMarketNonce(data)}` as const,
  }),
  chatEvent: (data: DatabaseJsonType["chat_events"] | MarketMetadataModel) => ({
    eventName: EVENT_NAMES.Chat,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.Chat}::${getMarketNonce(data)}` as const,
  }),
  liquidityEvent: (data: DatabaseJsonType["liquidity_events"] | MarketMetadataModel) => ({
    eventName: EVENT_NAMES.Liquidity,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.Liquidity}::${getMarketNonce(data)}` as const,
  }),
  marketLatestStateEvent: <
    T extends DatabaseJsonType["market_latest_state_event"] | MarketMetadataModel,
  >(
    data: T
  ) => ({
    eventName: EVENT_NAMES.State,
    guid: `${formatEmojis(data)}::${EVENT_NAMES.State}::${getMarketNonce(data)}` as const,
  }),
};

export const toGlobalStateEventModel = (data: DatabaseJsonType["global_state_events"]) => ({
  ...withTransactionMetadata(data),
  ...withGlobalStateEventData(data),
  ...GuidGetters.globalStateEvent(data),
});

export const toPeriodicStateEventModel = (data: DatabaseJsonType["periodic_state_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndEmitTime(data),
  ...withLastSwap(data),
  ...withPeriodicStateMetadata(data),
  ...withPeriodicStateEventData(data),
  ...withLastSwapData(data),
  ...GuidGetters.periodicStateEvent(data),
});

export const toMarketRegistrationEventModel = (
  data: DatabaseJsonType["market_registration_events"]
) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withMarketRegistrationEventData(data),
  ...GuidGetters.marketRegistrationEvent(data),
});

export const toSwapEventModel = (data: DatabaseJsonType["swap_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withSwapEventData(data),
  ...withStateEventData(data),
  ...withBlockAndEventIndex(data),
  ...GuidGetters.swapEvent(data),
});

export const toChatEventModel = (data: DatabaseJsonType["chat_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withChatEventData(data),
  ...withStateEventData(data),
  ...withLastSwapData(data),
  ...GuidGetters.chatEvent(data),
});

export const toLiquidityEventModel = (data: DatabaseJsonType["liquidity_events"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withLiquidityEventData(data),
  ...withStateEventData(data),
  ...withLastSwapData(data),
  ...withBlockAndEventIndex(data),
  ...GuidGetters.liquidityEvent(data),
});

/**
 * Default to 0n while the processor is in need of a cold upgrade, otherwise the /stats
 * page will fail to render and the build can't complete. This is temporary.
 */
const temporarilyDefaultToZero = (value: AnyNumberString) => BigInt(value ?? 0n);

// Note that daily TVL defaults to `0` since that's the initial value in the database.
export const toProcessedData = (
  data: ProcessedFields & { daily_tvl_per_lp_coin_growth_q64?: string }
) => ({
  dailyTvlPerLPCoinGrowth: Big(data.daily_tvl_per_lp_coin_growth ?? 0).toString(),
  inBondingCurve: data.in_bonding_curve,
  volumeIn1MStateTracker: BigInt(data.volume_in_1m_state_tracker),
  baseVolumeIn1MStateTracker: temporarilyDefaultToZero(data.base_volume_in_1m_state_tracker),
});

export const toMarketLatestStateEventModel = (
  data: DatabaseJsonType["market_latest_state_event"]
) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withStateEventData(data),
  ...withLastSwapData(data),
  ...toProcessedData(data),
  ...GuidGetters.marketLatestStateEvent(data),
});

export const toMarketStateModel = (data: DatabaseJsonType["market_state"]) => ({
  ...toMarketLatestStateEventModel(data),
  dailyVolume: BigInt(data.daily_volume),
  dailyBaseVolume: temporarilyDefaultToZero(data.daily_base_volume),
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

export const toUserLiquidityPoolsModel = (data: DatabaseJsonType["user_liquidity_pools"]) => {
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

export const toMarketDailyVolumeModel = (data: DatabaseJsonType["market_daily_volume"]) => ({
  marketID: BigInt(data.market_id),
  dailyVolume: BigInt(data.daily_volume),
});

export const toMarket1MPeriodsInLastDay = (
  data: DatabaseJsonType["market_1m_periods_in_last_day"]
) => ({
  marketID: BigInt(data.market_id),
  transactionVersion: BigInt(data.transaction_version),
  insertedAt: data.inserted_at ? postgresTimestampToDate(data.inserted_at) : new Date(0),
  nonce: BigInt(data.nonce),
  volume: BigInt(data.volume),
  baseVolume: BigInt(data.base_volume),
  startTime: data.start_time,
});

export const toProcessorStatus = (data: DatabaseJsonType["processor_status"]) => ({
  processor: data.processor,
  lastSuccessVersion: data.last_success_version,
  lastUpdated: postgresTimestampToDate(data.last_updated),
  lastTransactionTimestamp: postgresTimestampToDate(data.last_transaction_timestamp),
});

export const toUserPoolsRPCResponse = (data: DatabaseJsonType["user_pools"]) => ({
  ...withTransactionMetadata(data),
  ...withMarketAndStateMetadataAndBumpTime(data),
  ...withStateEventData(data),
  ...toProcessedData(data),
  ...withLPCoinBalance(data),
  dailyVolume: BigInt(data.daily_volume),
});

export const toArenaMeleeModel = (data: DatabaseJsonType["arena_melee_events"]) => ({
  ...withTransactionMetadata(data),
  ...withArenaMeleeData(data),
});

export const toArenaEnterModel = (data: DatabaseJsonType["arena_enter_events"]) => ({
  ...withTransactionMetadata(data),
  ...withArenaEnterData(data),
});

export const toArenaExitModel = (data: DatabaseJsonType["arena_exit_events"]) => ({
  ...withTransactionMetadata(data),
  ...withArenaExitData(data),
});

export const toArenaSwapModel = (data: DatabaseJsonType["arena_swap_events"]) => ({
  ...withTransactionMetadata(data),
  ...withArenaSwapData(data),
});

export const toArenaVaultBalanceUpdateModel = (
  data: DatabaseJsonType["arena_vault_balance_update_events"]
) => ({
  ...withTransactionMetadata(data),
  ...withArenaVaultBalanceUpdateData(data),
});

export const toArenaPositionsModel = toArenaPositionsFromDatabase;
export const toArenaLeaderboardModel = toArenaLeaderboardFromDatabase;
export const toArenaLeaderboardHistoryModel = toArenaLeaderboardHistoryFromDatabase;
export const toArenaInfoModel = toArenaInfoFromDatabase;

export const calculateDeltaPercentageForQ64s = (open: AnyNumberString, close: AnyNumberString) =>
  q64ToBig(close.toString()).div(q64ToBig(open.toString())).mul(100).sub(100).toNumber();

export const toPriceFeed = (data: DatabaseJsonType["price_feed"]) => {
  return {
    ...toMarketStateModel(data),
    openPrice: q64ToBig(data.open_price_q64).toNumber(),
    closePrice: q64ToBig(data.close_price_q64).toNumber(),
    deltaPercentage: calculateDeltaPercentageForQ64s(data.open_price_q64, data.close_price_q64),
  };
};

export const toAggregateMarketState = (data: DatabaseJsonType["aggregate_market_state"]) => ({
  lastEmojicoinTransactionVersion: BigInt(data.last_emojicoin_transaction_version),
  cumulativeChatMessages: BigInt(data.cumulative_chat_messages),
  cumulativeIntegratorFees: BigInt(data.cumulative_integrator_fees),
  cumulativeQuoteVolume: BigInt(data.cumulative_quote_volume),
  cumulativeSwaps: BigInt(data.cumulative_swaps),
  fullyDilutedValue: BigInt(data.fully_diluted_value),
  lastBumpTime: postgresTimestampToMicroseconds(data.last_bump_time),
  marketCap: BigInt(data.market_cap),
  numMarkets: BigInt(data.n_markets),
  nonce: BigInt(data.nonce),
  totalQuoteLocked: BigInt(data.total_quote_locked),
  totalValueLocked: BigInt(data.total_value_locked),
  numMarketsInBondingCurve: BigInt(data.n_markets_in_bonding_curve),
  numMarketsPostBondingCurve: BigInt(data.n_markets_post_bonding_curve),
  numGlobalStateEvents: BigInt(data.n_global_state_events),
  numMarketRegistrationEvents: BigInt(data.n_market_registration_events),
  numSwapEvents: BigInt(data.n_swap_events),
  numChatEvents: BigInt(data.n_chat_events),
  numLiquidityEvents: BigInt(data.n_liquidity_events),
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
  [TableName.MarketState]: toMarketStateModel,
  [TableName.ProcessorStatus]: toProcessorStatus,
  [TableName.PriceFeed]: toPriceFeed,
  [TableName.ArenaEnterEvents]: toArenaEnterModel,
  [TableName.ArenaMeleeEvents]: toArenaMeleeModel,
  [TableName.ArenaExitEvents]: toArenaExitModel,
  [TableName.ArenaSwapEvents]: toArenaSwapModel,
  [TableName.ArenaInfo]: toArenaInfoModel,
  [TableName.ArenaPositions]: toArenaPositionsModel,
  [TableName.ArenaVaultBalanceUpdateEvents]: toArenaVaultBalanceUpdateModel,
  [TableName.ArenaLeaderboard]: toArenaLeaderboardModel,
  [TableName.ArenaLeaderboardHistory]: toArenaLeaderboardHistoryModel,
  [DatabaseRpc.UserPools]: toUserPoolsRPCResponse,
  [DatabaseRpc.AggregateMarketState]: toAggregateMarketState,
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
  [TableName.PriceFeed]: PriceFeedModel;
  [TableName.ArenaMeleeEvents]: ArenaMeleeModel;
  [TableName.ArenaEnterEvents]: ArenaEnterModel;
  [TableName.ArenaExitEvents]: ArenaExitModel;
  [TableName.ArenaSwapEvents]: ArenaSwapModel;
  [TableName.ArenaVaultBalanceUpdateEvents]: ArenaVaultBalanceUpdateModel;
  [TableName.ArenaPositions]: ArenaPositionsModel;
  [TableName.ArenaInfo]: ArenaInfoModel;
  [TableName.ArenaLeaderboard]: ArenaLeaderboardModel;
  [TableName.ArenaLeaderboardHistory]: ArenaLeaderboardHistoryModel;
  [DatabaseRpc.UserPools]: UserPoolsRPCModel;
  [DatabaseRpc.AggregateMarketState]: AggregateMarketStateModel;
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

export * from "./common";
export * from "./json-types";
export * from "./postgres-numeric-types";
