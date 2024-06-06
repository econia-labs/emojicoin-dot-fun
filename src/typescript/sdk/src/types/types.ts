import { hexToBytes } from "@noble/hashes/utils";
import { type AccountAddress, type TypeTag } from "@aptos-labs/ts-sdk";
import { type AccountAddressString } from "../emojicoin_dot_fun/types";
import type JSONTypes from "./json-types";
import { fromAggregatorSnapshot } from "./core";
import { normalizeAddress } from "../utils/account-address";

type WithVersion = {
  version: number;
};

export namespace Types {
  export type EmojicoinInfo = {
    marketAddress: AccountAddress;
    emojicoin: TypeTag;
    emojicoinLP: TypeTag;
  };

  export type ExtendRef = {
    self: AccountAddressString;
  };

  export type SequenceInfo = {
    nonce: bigint;
    lastBumpTime: bigint;
  };

  export type TVLtoLPCoinRatio = {
    tvl: bigint;
    lpCoins: bigint;
  };

  export type PeriodicStateTracker = {
    startTime: bigint;
    period: bigint;
    open: bigint;
    high: bigint;
    low: bigint;
    close: bigint;
    volumeBase: bigint;
    volumeQuote: bigint;
    integratorFees: bigint;
    poolFeesBase: bigint;
    poolFeesQuote: bigint;
    numSwaps: bigint;
    numChatMessages: bigint;
    startsInBondingCurve: boolean;
    endsInBondingCurve: boolean;
    coinRatioStart: TVLtoLPCoinRatio;
    coinRatioEnd: TVLtoLPCoinRatio;
  };

  export type RegistryAddress = {
    registryAddress: AccountAddressString;
  };

  export type RegistryView = {
    registryAddress: AccountAddressString;
    nonce: bigint;
    lastBumpTime: bigint;
    numMarkets: bigint;
    cumulativeQuoteVolume: bigint;
    totalQuoteLocked: bigint;
    totalValueLocked: bigint;
    marketCap: bigint;
    fullyDilutedValue: bigint;
    cumulativeIntegratorFees: bigint;
    cumulativeSwaps: bigint;
    cumulativeChatMessages: bigint;
  };

  export type MarketView = {
    metadata: MarketMetadata;
    sequenceInfo: SequenceInfo;
    clammVirtualReserves: Reserves;
    cpammRealReserves: Reserves;
    lpCoinSupply: bigint;
    inBondingCurve: boolean;
    cumulativeStats: CumulativeStats;
    instantaneousStats: InstantaneousStats;
    lastSwap: LastSwap;
    periodicStateTrackers: Array<PeriodicStateTracker>;
    aptosCoinBalance: bigint;
    emojicoinBalance: bigint;
    emojicoinLPBalance: bigint;
  };

  export type MarketResource = {
    metadata: MarketMetadata;
    sequenceInfo: SequenceInfo;
    extendRef: ExtendRef;
    clammVirtualReserves: Reserves;
    cpammRealReserves: Reserves;
    lpCoinSupply: bigint;
    cumulativeStats: CumulativeStats;
    lastSwap: LastSwap;
    periodicStateTrackers: Array<PeriodicStateTracker>;
  };

  export type MarketMetadata = {
    marketID: bigint;
    marketAddress: AccountAddressString;
    emojiBytes: Uint8Array;
  };

  export type Reserves = {
    base: bigint;
    quote: bigint;
  };

  export type PeriodicStateMetadata = {
    startTime: bigint;
    period: bigint;
    emitTime: bigint;
    emitMarketNonce: bigint;
    trigger: number;
  };

  export type StateMetadata = {
    marketNonce: bigint;
    bumpTime: bigint;
    trigger: number;
  };

  export type CumulativeStats = {
    baseVolume: bigint;
    quoteVolume: bigint;
    integratorFees: bigint;
    poolFeesBase: bigint;
    poolFeesQuote: bigint;
    numSwaps: bigint;
    numChatMessages: bigint;
  };

  export type InstantaneousStats = {
    totalQuoteLocked: bigint;
    totalValueLocked: bigint;
    marketCap: bigint;
    fullyDilutedValue: bigint;
  };

  export type LastSwap = {
    isSell: boolean;
    avgExecutionPrice: bigint;
    baseVolume: bigint;
    quoteVolume: bigint;
    nonce: bigint;
    time: bigint;
  };

  export type SwapEvent = WithVersion & {
    marketID: bigint;
    time: bigint;
    marketNonce: bigint;
    swapper: AccountAddressString;
    inputAmount: bigint;
    isSell: boolean;
    integrator: AccountAddressString;
    integratorFeeRateBPs: number;
    netProceeds: bigint;
    baseVolume: bigint;
    quoteVolume: bigint;
    avgExecutionPrice: bigint;
    integratorFee: bigint;
    poolFee: bigint;
    startsInBondingCurve: boolean;
    resultsInStateTransition: boolean;
  };

  export type ChatEvent = WithVersion & {
    marketMetadata: MarketMetadata;
    emitTime: bigint;
    emitMarketNonce: bigint;
    user: AccountAddressString;
    message: string;
    userEmojicoinBalance: bigint;
    circulatingSupply: bigint;
    balanceAsFractionOfCirculatingSupply: bigint;
  };

  export type MarketRegistrationEvent = WithVersion & {
    marketMetadata: MarketMetadata;
    time: bigint;
    registrant: AccountAddressString;
    integrator: AccountAddressString;
    integratorFee: bigint;
  };

  export type PeriodicStateEvent = WithVersion & {
    marketMetadata: MarketMetadata;
    periodicStateMetadata: PeriodicStateMetadata;
    open: bigint;
    high: bigint;
    low: bigint;
    close: bigint;
    volumeBase: bigint;
    volumeQuote: bigint;
    integratorFees: bigint;
    poolFeesBase: bigint;
    poolFeesQuote: bigint;
    numSwaps: bigint;
    numChatMessages: bigint;
    startsInBondingCurve: boolean;
    endsInBondingCurve: boolean;
    tvlPerLPCoinGrowth: bigint;
  };

  export type StateEvent = WithVersion & {
    marketMetadata: MarketMetadata;
    stateMetadata: StateMetadata;
    clammVirtualReserves: Reserves;
    cpammRealReserves: Reserves;
    lpCoinSupply: bigint;
    cumulativeStats: CumulativeStats;
    instantaneousStats: InstantaneousStats;
    lastSwap: LastSwap;
  };

  export type GlobalStateEvent = WithVersion & {
    emitTime: bigint;
    registryNonce: bigint;
    trigger: number;
    cumulativeQuoteVolume: bigint;
    totalQuoteLocked: bigint;
    totalValueLocked: bigint;
    marketCap: bigint;
    fullyDilutedValue: bigint;
    cumulativeIntegratorFees: bigint;
    cumulativeSwaps: bigint;
    cumulativeChatMessages: bigint;
  };

  export type LiquidityEvent = WithVersion & {
    marketID: bigint;
    time: bigint;
    marketNonce: bigint;
    provider: AccountAddressString;
    baseAmount: bigint;
    quoteAmount: bigint;
    lpCoinAmount: bigint;
    liquidityProvided: boolean;
    proRataBaseDonationClaimAmount: bigint;
    proRataQuoteDonationClaimAmount: bigint;
  };

  // One row in the `inbox_latest_state` table.
  export type InboxLatestState = StateEvent & {
    version: number;
    marketID: number;
  };

  // Query return type for `market_data` view.
  export type MarketDataView = {
    marketID: number;
    marketAddress: `0x${string}`;
    marketCap: number;
    bumpTime: number;
    version: number;
    numSwaps: number;
    numChatMessages: number;
    clammVirtualReserves: Reserves;
    cpammRealReserves: Reserves;
    lpCoinSupply: number;
    avgExecutionPrice: number;
    emojiBytes: `0x${string}`;
    allTimeVolume: number;
    dailyVolume: number;
  };
}
export const toExtendRef = (data: JSONTypes.ExtendRef): Types.ExtendRef => ({
  self: data.self,
});

export const toSequenceInfo = (data: JSONTypes.SequenceInfo): Types.SequenceInfo => ({
  nonce: BigInt(data.nonce),
  lastBumpTime: BigInt(data.last_bump_time),
});

export const toTVLtoLPCoinRatio = (data: JSONTypes.TVLtoLPCoinRatio): Types.TVLtoLPCoinRatio => ({
  tvl: BigInt(data.tvl),
  lpCoins: BigInt(data.lp_coins),
});

export const toReserves = (data: JSONTypes.Reserves): Types.Reserves => ({
  base: BigInt(data.base),
  quote: BigInt(data.quote),
});

export const toPeriodicStateTracker = (
  data: JSONTypes.PeriodicStateTracker
): Types.PeriodicStateTracker => ({
  startTime: BigInt(data.start_time),
  period: BigInt(data.period),
  open: BigInt(data.open_price_q64),
  high: BigInt(data.high_price_q64),
  low: BigInt(data.low_price_q64),
  close: BigInt(data.close_price_q64),
  volumeBase: BigInt(data.volume_base),
  volumeQuote: BigInt(data.volume_quote),
  integratorFees: BigInt(data.integrator_fees),
  poolFeesBase: BigInt(data.pool_fees_base),
  poolFeesQuote: BigInt(data.pool_fees_quote),
  numSwaps: BigInt(data.n_swaps),
  numChatMessages: BigInt(data.n_chat_messages),
  startsInBondingCurve: data.starts_in_bonding_curve,
  endsInBondingCurve: data.ends_in_bonding_curve,
  coinRatioStart: toTVLtoLPCoinRatio(data.tvl_to_lp_coin_ratio_start),
  coinRatioEnd: toTVLtoLPCoinRatio(data.tvl_to_lp_coin_ratio_end),
});

export const toRegistryAddress = (data: JSONTypes.RegistryAddress): Types.RegistryAddress => ({
  registryAddress: normalizeAddress(data.registry_address),
});

const strToBigInt = (data: string): bigint => BigInt(data);

export const toRegistryView = (data: JSONTypes.RegistryView): Types.RegistryView => ({
  registryAddress: normalizeAddress(data.registry_address),
  nonce: fromAggregatorSnapshot(data.nonce, strToBigInt),
  lastBumpTime: BigInt(data.last_bump_time),
  numMarkets: BigInt(data.n_markets),
  cumulativeQuoteVolume: fromAggregatorSnapshot(data.cumulative_quote_volume, strToBigInt),
  totalQuoteLocked: fromAggregatorSnapshot(data.total_quote_locked, strToBigInt),
  totalValueLocked: fromAggregatorSnapshot(data.total_value_locked, strToBigInt),
  marketCap: fromAggregatorSnapshot(data.market_cap, strToBigInt),
  fullyDilutedValue: fromAggregatorSnapshot(data.fully_diluted_value, strToBigInt),
  cumulativeIntegratorFees: fromAggregatorSnapshot(data.cumulative_integrator_fees, strToBigInt),
  cumulativeSwaps: fromAggregatorSnapshot(data.cumulative_swaps, strToBigInt),
  cumulativeChatMessages: fromAggregatorSnapshot(data.cumulative_chat_messages, strToBigInt),
});

export const toMarketMetadata = (data: JSONTypes.MarketMetadata): Types.MarketMetadata => ({
  marketID: BigInt(data.market_id),
  marketAddress: normalizeAddress(data.market_address),
  emojiBytes: hexToBytes(
    data.emoji_bytes.startsWith("0x") ? data.emoji_bytes.slice(2) : data.emoji_bytes
  ),
});

export const toCumulativeStats = (data: JSONTypes.CumulativeStats): Types.CumulativeStats => ({
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  integratorFees: BigInt(data.integrator_fees),
  poolFeesBase: BigInt(data.pool_fees_base),
  poolFeesQuote: BigInt(data.pool_fees_quote),
  numSwaps: BigInt(data.n_swaps),
  numChatMessages: BigInt(data.n_chat_messages),
});

export const toInstantaneousStats = (
  data: JSONTypes.InstantaneousStats
): Types.InstantaneousStats => ({
  totalQuoteLocked: BigInt(data.total_quote_locked),
  totalValueLocked: BigInt(data.total_value_locked),
  marketCap: BigInt(data.market_cap),
  fullyDilutedValue: BigInt(data.fully_diluted_value),
});

export const toLastSwap = (data: JSONTypes.LastSwap): Types.LastSwap => ({
  isSell: data.is_sell,
  avgExecutionPrice: BigInt(data.avg_execution_price_q64),
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  nonce: BigInt(data.nonce),
  time: BigInt(data.time),
});

export const toMarketView = (data: JSONTypes.MarketView): Types.MarketView => ({
  metadata: toMarketMetadata(data.metadata),
  sequenceInfo: toSequenceInfo(data.sequence_info),
  clammVirtualReserves: toReserves(data.clamm_virtual_reserves),
  cpammRealReserves: toReserves(data.cpamm_real_reserves),
  lpCoinSupply: BigInt(data.lp_coin_supply),
  inBondingCurve: data.in_bonding_curve,
  cumulativeStats: toCumulativeStats(data.cumulative_stats),
  instantaneousStats: toInstantaneousStats(data.instantaneous_stats),
  lastSwap: toLastSwap(data.last_swap),
  periodicStateTrackers: data.periodic_state_trackers.map((v) => toPeriodicStateTracker(v)),
  aptosCoinBalance: BigInt(data.aptos_coin_balance),
  emojicoinBalance: BigInt(data.emojicoin_balance),
  emojicoinLPBalance: BigInt(data.emojicoin_lp_balance),
});

export const toMarketResource = (data: JSONTypes.MarketResource): Types.MarketResource => ({
  metadata: toMarketMetadata(data.metadata),
  sequenceInfo: toSequenceInfo(data.sequence_info),
  extendRef: toExtendRef(data.extend_ref),
  clammVirtualReserves: toReserves(data.clamm_virtual_reserves),
  cpammRealReserves: toReserves(data.cpamm_real_reserves),
  lpCoinSupply: BigInt(data.lp_coin_supply),
  cumulativeStats: toCumulativeStats(data.cumulative_stats),
  lastSwap: toLastSwap(data.last_swap),
  periodicStateTrackers: data.periodic_state_trackers.map((v) => toPeriodicStateTracker(v)),
});

export const toPeriodicStateMetadata = (
  data: JSONTypes.PeriodicStateMetadata
): Types.PeriodicStateMetadata => ({
  startTime: BigInt(data.start_time),
  period: BigInt(data.period),
  emitTime: BigInt(data.emit_time),
  emitMarketNonce: BigInt(data.emit_market_nonce),
  trigger: Number(data.trigger),
});

export const toStateMetadata = (data: JSONTypes.StateMetadata): Types.StateMetadata => ({
  marketNonce: BigInt(data.market_nonce),
  bumpTime: BigInt(data.bump_time),
  trigger: Number(data.trigger),
});

export const toSwapEvent = (data: JSONTypes.SwapEvent, version: number): Types.SwapEvent => ({
  version,
  marketID: BigInt(data.market_id),
  time: BigInt(data.time),
  marketNonce: BigInt(data.market_nonce),
  swapper: data.swapper,
  inputAmount: BigInt(data.input_amount),
  isSell: data.is_sell,
  integrator: data.integrator,
  integratorFeeRateBPs: Number(data.integrator_fee_rate_bps),
  netProceeds: BigInt(data.net_proceeds),
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  avgExecutionPrice: BigInt(data.avg_execution_price_q64),
  integratorFee: BigInt(data.integrator_fee),
  poolFee: BigInt(data.pool_fee),
  startsInBondingCurve: data.starts_in_bonding_curve,
  resultsInStateTransition: data.results_in_state_transition,
});

export const toChatEvent = (data: JSONTypes.ChatEvent, version: number): Types.ChatEvent => ({
  version,
  marketMetadata: toMarketMetadata(data.market_metadata),
  emitTime: BigInt(data.emit_time),
  emitMarketNonce: BigInt(data.emit_market_nonce),
  user: normalizeAddress(data.user),
  message: data.message,
  userEmojicoinBalance: BigInt(data.user_emojicoin_balance),
  circulatingSupply: BigInt(data.circulating_supply),
  balanceAsFractionOfCirculatingSupply: BigInt(data.balance_as_fraction_of_circulating_supply_q64),
});

export const toMarketRegistrationEvent = (
  data: JSONTypes.MarketRegistrationEvent,
  version: number
): Types.MarketRegistrationEvent => ({
  version,
  marketMetadata: toMarketMetadata(data.market_metadata),
  time: BigInt(data.time),
  registrant: normalizeAddress(data.registrant),
  integrator: normalizeAddress(data.integrator),
  integratorFee: BigInt(data.integrator_fee),
});

export const toPeriodicStateMeta = (
  data: JSONTypes.PeriodicStateMetadata
): Types.PeriodicStateMetadata => ({
  startTime: BigInt(data.start_time),
  period: BigInt(data.period),
  emitTime: BigInt(data.emit_time),
  emitMarketNonce: BigInt(data.emit_market_nonce),
  trigger: Number(data.trigger),
});

export const toPeriodicStateEvent = (
  data: JSONTypes.PeriodicStateEvent,
  version: number
): Types.PeriodicStateEvent => ({
  version,
  marketMetadata: toMarketMetadata(data.market_metadata),
  periodicStateMetadata: toPeriodicStateMetadata(data.periodic_state_metadata),
  open: BigInt(data.open_price_q64),
  high: BigInt(data.high_price_q64),
  low: BigInt(data.low_price_q64),
  close: BigInt(data.close_price_q64),
  volumeBase: BigInt(data.volume_base),
  volumeQuote: BigInt(data.volume_quote),
  integratorFees: BigInt(data.integrator_fees),
  poolFeesBase: BigInt(data.pool_fees_base),
  poolFeesQuote: BigInt(data.pool_fees_quote),
  numSwaps: BigInt(data.n_swaps),
  numChatMessages: BigInt(data.n_chat_messages),
  startsInBondingCurve: data.starts_in_bonding_curve,
  endsInBondingCurve: data.ends_in_bonding_curve,
  tvlPerLPCoinGrowth: BigInt(data.tvl_per_lp_coin_growth_q64),
});

export const toStateEvent = (data: JSONTypes.StateEvent, version: number): Types.StateEvent => ({
  version,
  marketMetadata: toMarketMetadata(data.market_metadata),
  stateMetadata: toStateMetadata(data.state_metadata),
  clammVirtualReserves: toReserves(data.clamm_virtual_reserves),
  cpammRealReserves: toReserves(data.cpamm_real_reserves),
  lpCoinSupply: BigInt(data.lp_coin_supply),
  cumulativeStats: toCumulativeStats(data.cumulative_stats),
  instantaneousStats: toInstantaneousStats(data.instantaneous_stats),
  lastSwap: toLastSwap(data.last_swap),
});

export const toGlobalStateEvent = (
  data: JSONTypes.GlobalStateEvent,
  version: number
): Types.GlobalStateEvent => ({
  version,
  emitTime: BigInt(data.emit_time),
  registryNonce: fromAggregatorSnapshot(data.registry_nonce, strToBigInt),
  trigger: data.trigger,
  cumulativeQuoteVolume: fromAggregatorSnapshot(data.cumulative_quote_volume, strToBigInt),
  totalQuoteLocked: fromAggregatorSnapshot(data.total_quote_locked, strToBigInt),
  totalValueLocked: fromAggregatorSnapshot(data.total_value_locked, strToBigInt),
  marketCap: fromAggregatorSnapshot(data.market_cap, strToBigInt),
  fullyDilutedValue: fromAggregatorSnapshot(data.fully_diluted_value, strToBigInt),
  cumulativeIntegratorFees: fromAggregatorSnapshot(data.cumulative_integrator_fees, strToBigInt),
  cumulativeSwaps: fromAggregatorSnapshot(data.cumulative_swaps, strToBigInt),
  cumulativeChatMessages: fromAggregatorSnapshot(data.cumulative_chat_messages, strToBigInt),
});

export const toLiquidityEvent = (
  data: JSONTypes.LiquidityEvent,
  version: number
): Types.LiquidityEvent => ({
  version,
  marketID: BigInt(data.market_id),
  time: BigInt(data.time),
  marketNonce: BigInt(data.market_nonce),
  provider: data.provider,
  baseAmount: BigInt(data.base_amount),
  quoteAmount: BigInt(data.quote_amount),
  lpCoinAmount: BigInt(data.lp_coin_amount),
  liquidityProvided: data.liquidity_provided,
  proRataBaseDonationClaimAmount: BigInt(data.pro_rata_base_donation_claim_amount),
  proRataQuoteDonationClaimAmount: BigInt(data.pro_rata_quote_donation_claim_amount),
});

export const toInboxLatestState = (data: JSONTypes.InboxLatestState): Types.InboxLatestState => ({
  ...toStateEvent(data, data.transaction_version),
  version: data.transaction_version,
  marketID: data.marketID,
});

export const toMarketDataView = (data: JSONTypes.MarketDataView): Types.MarketDataView => ({
  marketID: Number(data.market_id),
  marketAddress: normalizeAddress(data.market_address),
  marketCap: Number(data.market_cap),
  bumpTime: Number(data.bump_time),
  version: Number(data.transaction_version),
  numSwaps: Number(data.n_swaps),
  numChatMessages: Number(data.n_chat_messages),
  clammVirtualReserves: toReserves(data.clamm_virtual_reserves),
  cpammRealReserves: toReserves(data.cpamm_real_reserves),
  lpCoinSupply: Number(data.lp_coin_supply),
  avgExecutionPrice: Number(data.avg_execution_price_q64),
  allTimeVolume: Number(data.all_time_volume),
  dailyVolume: Number(data.daily_volume),
  emojiBytes: data.emoji_bytes,
});

export type AnyContractType =
  | Types.ExtendRef
  | Types.SequenceInfo
  | Types.TVLtoLPCoinRatio
  | Types.PeriodicStateTracker
  | Types.RegistryAddress
  | Types.RegistryView
  | Types.MarketView
  | Types.MarketResource
  | Types.MarketMetadata
  | Types.Reserves
  | Types.PeriodicStateMetadata
  | Types.StateMetadata
  | Types.CumulativeStats
  | Types.InstantaneousStats
  | Types.LastSwap
  | Types.SwapEvent
  | Types.ChatEvent
  | Types.MarketRegistrationEvent
  | Types.PeriodicStateEvent
  | Types.StateEvent
  | Types.GlobalStateEvent
  | Types.LiquidityEvent;

export type AnyEmojicoinEvent =
  | Types.SwapEvent
  | Types.ChatEvent
  | Types.MarketRegistrationEvent
  | Types.PeriodicStateEvent
  | Types.StateEvent
  | Types.GlobalStateEvent
  | Types.LiquidityEvent;
