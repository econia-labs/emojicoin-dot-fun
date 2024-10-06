import { hexToBytes } from "@noble/hashes/utils";
import { type AccountAddress, type TypeTag } from "@aptos-labs/ts-sdk";
import { type AccountAddressString } from "../emojicoin_dot_fun/types";
import type JsonTypes from "./json-types";
import { fromAggregatorSnapshot } from "./core";
import { standardizeAddress } from "../utils/account-address";
import { type Trigger, type EMOJICOIN_DOT_FUN_MODULE_NAME, rawTriggerToEnum } from "../const";
import {
  type AnyEmojicoinJSONEvent,
  isJSONChatEvent,
  isJSONGlobalStateEvent,
  isJSONLiquidityEvent,
  isJSONMarketRegistrationEvent,
  isJSONPeriodicStateEvent,
  isJSONStateEvent,
  isJSONSwapEvent,
} from "./json-types";
import { type STRUCT_STRINGS } from "../utils";
import { Flatten } from ".";

export type AnyNumberString = number | string | bigint;
const strToBigInt = (data: string): bigint => BigInt(data);

export type EventName =
  | "Swap"
  | "Chat"
  | "MarketRegistration"
  | "PeriodicState"
  | "State"
  | "GlobalState"
  | "Liquidity";

export type WithVersionAndGUID = {
  version: number | string;
  guid: `${EventName}::${string}`;
};

export type WithMarketID = {
  marketID: bigint;
};

export type Types = {
  EmojicoinInfo: {
    marketAddress: AccountAddress;
    emojicoin: TypeTag;
    emojicoinLP: TypeTag;
  };

  TableHandle: {
    handle: AccountAddressString;
  };

  ExtendRef: {
    self: AccountAddressString;
  };

  SmartTable: {
    buckets: {
      inner: Types["TableHandle"];
      length: number;
    };
    level: number;
    numBuckets: number;
    size: bigint;
    splitLoadThreshold: number;
    targetBucketSize: number;
  };

  SequenceInfo: {
    nonce: bigint;
    lastBumpTime: bigint;
  };

  ParallelizableSequenceInfo: Types["SequenceInfo"];

  TVLtoLPCoinRatio: {
    tvl: bigint;
    lpCoins: bigint;
  };

  PeriodicStateTracker: {
    startTime: bigint;
    period: bigint;
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
    coinRatioStart: Types["TVLtoLPCoinRatio"];
    coinRatioEnd: Types["TVLtoLPCoinRatio"];
  };

  RegistryAddress: {
    registryAddress: AccountAddressString;
  };

  RegistryView: {
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

  // The result of the contract's `market_view` view function. NOT the database view.
  MarketView: {
    metadata: Types["MarketMetadata"];
    sequenceInfo: Types["SequenceInfo"];
    clammVirtualReservesBase: bigint;
    clammVirtualReservesQuote: bigint;
    cpammRealReservesBase: bigint;
    cpammRealReservesQuote: bigint;
    lpCoinSupply: bigint;
    inBondingCurve: boolean;
    cumulativeStats: Types["CumulativeStats"];
    instantaneousStats: Types["InstantaneousStats"];
    lastSwap: Types["LastSwap"];
    periodicStateTrackers: Array<Types["PeriodicStateTracker"]>;
    aptosCoinBalance: bigint;
    emojicoinBalance: bigint;
    emojicoinLPBalance: bigint;
  };

  Market: {
    metadata: Types["MarketMetadata"];
    sequenceInfo: Types["SequenceInfo"];
    extendRef: Types["ExtendRef"];
    clammVirtualReserves: Types["Reserves"];
    cpammRealReserves: Types["Reserves"];
    lpCoinSupply: bigint;
    cumulativeStats: Types["CumulativeStats"];
    lastSwap: Types["LastSwap"];
    periodicStateTrackers: Array<Types["PeriodicStateTracker"]>;
  };

  Registry: {
    coinSymbolEmojis: AccountAddressString;
    extendRef: Types["ExtendRef"];
    globalStats: {
      cumulativeQuoteVolume: bigint;
      totalQuoteLocked: bigint;
      totalValueLocked: bigint;
      marketCap: bigint;
      fullyDilutedValue: bigint;
      cumulativeIntegratorFees: bigint;
      cumulativeSwaps: bigint;
      cumulativeChatMessages: bigint;
    };
    marketsByEmojiBytes: Types["SmartTable"];
    marketsByMarketID: Types["SmartTable"];
    registryAddress: AccountAddressString;
    sequenceInfo: Types["SequenceInfo"];
    supplementalChatEmojis: Types["TableHandle"];
  };

  MarketMetadata: {
    marketID: bigint;
    marketAddress: AccountAddressString;
    emojiBytes: Uint8Array;
  };

  Reserves: {
    base: bigint;
    quote: bigint;
  };

  PeriodicStateMetadata: {
    startTime: bigint;
    period: bigint;
    emitTime: bigint;
    emitMarketNonce: bigint;
    trigger: Trigger;
  };

  StateMetadata: {
    marketNonce: bigint;
    bumpTime: bigint;
    trigger: Trigger;
  };

  CumulativeStats: {
    baseVolume: bigint;
    quoteVolume: bigint;
    integratorFees: bigint;
    poolFeesBase: bigint;
    poolFeesQuote: bigint;
    numSwaps: bigint;
    numChatMessages: bigint;
  };

  InstantaneousStats: {
    totalQuoteLocked: bigint;
    totalValueLocked: bigint;
    marketCap: bigint;
    fullyDilutedValue: bigint;
  };

  LastSwap: {
    isSell: boolean;
    avgExecutionPriceQ64: bigint;
    baseVolume: bigint;
    quoteVolume: bigint;
    nonce: bigint;
    time: bigint;
  };

  SwapEvent: Flatten<WithMarketID &
    WithVersionAndGUID & {
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
      avgExecutionPriceQ64: bigint;
      integratorFee: bigint;
      poolFee: bigint;
      startsInBondingCurve: boolean;
      resultsInStateTransition: boolean;
      balanceAsFractionOfCirculatingSupplyBeforeQ64: bigint;
      balanceAsFractionOfCirculatingSupplyAfterQ64: bigint;
    }>;

  ChatEvent: Flatten<WithMarketID &
    WithVersionAndGUID & {
      marketMetadata: Types["MarketMetadata"];
      emitTime: bigint;
      emitMarketNonce: bigint;
      user: AccountAddressString;
      message: string;
      userEmojicoinBalance: bigint;
      circulatingSupply: bigint;
      balanceAsFractionOfCirculatingSupplyQ64: bigint;
    }>;

  MarketRegistrationEvent: Flatten<WithMarketID &
    WithVersionAndGUID & {
      marketMetadata: Types["MarketMetadata"];
      time: bigint;
      registrant: AccountAddressString;
      integrator: AccountAddressString;
      integratorFee: bigint;
    }>;

  PeriodicStateEvent: Flatten<WithMarketID &
    WithVersionAndGUID & {
      marketMetadata: Types["MarketMetadata"];
      periodicStateMetadata: Types["PeriodicStateMetadata"];
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
    }>;

  StateEvent: Flatten<WithMarketID &
    WithVersionAndGUID & {
      marketMetadata: Types["MarketMetadata"];
      stateMetadata: Types["StateMetadata"];
      clammVirtualReserves: Types["Reserves"];
      cpammRealReserves: Types["Reserves"];
      lpCoinSupply: bigint;
      cumulativeStats: Types["CumulativeStats"];
      instantaneousStats: Types["InstantaneousStats"];
      lastSwap: Types["LastSwap"];
    }>;

  GlobalStateEvent: Flatten<WithVersionAndGUID & {
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
  }>;

  LiquidityEvent: Flatten<WithMarketID &
    WithVersionAndGUID & {
      marketID: bigint;
      time: bigint;
      marketNonce: bigint;
      provider: AccountAddressString;
      baseAmount: bigint;
      quoteAmount: bigint;
      lpCoinAmount: bigint;
      liquidityProvided: boolean;
      baseDonationClaimAmount: bigint;
      quoteDonationClaimAmount: bigint;
    }>;

  // Query return type for `market_data` view.
  MarketDataView: {
    marketID: number;
    marketAddress: `0x${string}`;
    marketCap: number;
    bumpTime: number;
    version: number | string;
    numSwaps: number;
    numChatMessages: number;
    clammVirtualReservesBase: number;
    clammVirtualReservesQuote: number;
    cpammRealReservesBase: number;
    cpammRealReservesQuote: number;
    lpCoinSupply: number;
    avgExecutionPriceQ64: number;
    emojiBytes: `0x${string}`;
    allTimeVolume: number;
    dailyVolume: number;
    tvlPerLpCoinGrowth: number;
  };

  RegistrantGracePeriodFlag: {
    marketRegistrant: `0x${string}`;
    marketRegistrationTime: bigint;
  };

  EmojicoinDotFunRewards: {
    swap: Types["SwapEvent"];
    octasRewardAmount: bigint;
  };
};

export const toExtendRef = (data: JsonTypes["ExtendRef"]): Types["ExtendRef"] => ({
  self: standardizeAddress(data.self),
});

export const toSequenceInfo = (data: JsonTypes["SequenceInfo"]): Types["SequenceInfo"] => ({
  nonce: BigInt(data.nonce),
  lastBumpTime: BigInt(data.last_bump_time),
});

export const toParallelizableSequenceInfo = (
  data: JsonTypes["ParallelizableSequenceInfo"]
): Types["ParallelizableSequenceInfo"] => ({
  nonce: fromAggregatorSnapshot(data.nonce, strToBigInt),
  lastBumpTime: BigInt(data.last_bump_time),
});

export const toTVLtoLPCoinRatio = (
  data: JsonTypes["TVLtoLPCoinRatio"]
): Types["TVLtoLPCoinRatio"] => ({
  tvl: BigInt(data.tvl),
  lpCoins: BigInt(data.lp_coins),
});

export const toReserves = (data: JsonTypes["Reserves"]): Types["Reserves"] => ({
  base: BigInt(data.base),
  quote: BigInt(data.quote),
});

export const toPeriodicStateTracker = (
  data: JsonTypes["PeriodicStateTracker"]
): Types["PeriodicStateTracker"] => ({
  startTime: BigInt(data.start_time),
  period: BigInt(data.period),
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
  coinRatioStart: toTVLtoLPCoinRatio(data.tvl_to_lp_coin_ratio_start),
  coinRatioEnd: toTVLtoLPCoinRatio(data.tvl_to_lp_coin_ratio_end),
});

export const toRegistryAddress = (
  data: JsonTypes["RegistryAddress"]
): Types["RegistryAddress"] => ({
  registryAddress: standardizeAddress(data.registry_address),
});

export const toRegistryView = (data: JsonTypes["RegistryView"]): Types["RegistryView"] => ({
  registryAddress: standardizeAddress(data.registry_address),
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

export const toMarketMetadata = (data: JsonTypes["MarketMetadata"]): Types["MarketMetadata"] => ({
  marketID: BigInt(data.market_id),
  marketAddress: standardizeAddress(data.market_address),
  emojiBytes: hexToBytes(
    data.emoji_bytes.startsWith("0x") ? data.emoji_bytes.slice(2) : data.emoji_bytes
  ),
});

export const toCumulativeStats = (
  data: JsonTypes["CumulativeStats"]
): Types["CumulativeStats"] => ({
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  integratorFees: BigInt(data.integrator_fees),
  poolFeesBase: BigInt(data.pool_fees_base),
  poolFeesQuote: BigInt(data.pool_fees_quote),
  numSwaps: BigInt(data.n_swaps),
  numChatMessages: BigInt(data.n_chat_messages),
});

export const toInstantaneousStats = (
  data: JsonTypes["InstantaneousStats"]
): Types["InstantaneousStats"] => ({
  totalQuoteLocked: BigInt(data.total_quote_locked),
  totalValueLocked: BigInt(data.total_value_locked),
  marketCap: BigInt(data.market_cap),
  fullyDilutedValue: BigInt(data.fully_diluted_value),
});

export const toLastSwap = (data: JsonTypes["LastSwap"]): Types["LastSwap"] => ({
  isSell: data.is_sell,
  avgExecutionPriceQ64: BigInt(data.avg_execution_price_q64),
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  nonce: BigInt(data.nonce),
  time: BigInt(data.time),
});

export const toMarketView = (data: JsonTypes["MarketView"]): Types["MarketView"] => ({
  metadata: toMarketMetadata(data.metadata),
  sequenceInfo: toSequenceInfo(data.sequence_info),

  clammVirtualReservesBase: BigInt(data.clamm_virtual_reserves.base),
  clammVirtualReservesQuote: BigInt(data.clamm_virtual_reserves.quote),
  cpammRealReservesBase: BigInt(data.cpamm_real_reserves.base),
  cpammRealReservesQuote: BigInt(data.cpamm_real_reserves.quote),
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

export const toMarketResource = (data: JsonTypes["Market"]): Types["Market"] => ({
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

export const toSmartTable = (data: JsonTypes["SmartTable"]): Types["SmartTable"] => ({
  buckets: {
    inner: {
      handle: standardizeAddress(data.buckets.inner.handle),
    },
    length: Number(data.buckets.length),
  },
  level: Number(data.level),
  numBuckets: Number(data.num_buckets),
  size: BigInt(data.size),
  splitLoadThreshold: data.split_load_threshold,
  targetBucketSize: Number(data.target_bucket_size),
});

export const toRegistryResource = (data: JsonTypes["Registry"]): Types["Registry"] => ({
  coinSymbolEmojis: standardizeAddress(data.coin_symbol_emojis.handle),
  extendRef: toExtendRef(data.extend_ref),
  globalStats: {
    cumulativeQuoteVolume: fromAggregatorSnapshot(
      data.global_stats.cumulative_quote_volume,
      strToBigInt
    ),
    totalQuoteLocked: fromAggregatorSnapshot(data.global_stats.total_quote_locked, strToBigInt),
    totalValueLocked: fromAggregatorSnapshot(data.global_stats.total_value_locked, strToBigInt),
    marketCap: fromAggregatorSnapshot(data.global_stats.market_cap, strToBigInt),
    fullyDilutedValue: fromAggregatorSnapshot(data.global_stats.fully_diluted_value, strToBigInt),
    cumulativeIntegratorFees: fromAggregatorSnapshot(
      data.global_stats.cumulative_integrator_fees,
      strToBigInt
    ),
    cumulativeSwaps: fromAggregatorSnapshot(data.global_stats.cumulative_swaps, strToBigInt),
    cumulativeChatMessages: fromAggregatorSnapshot(
      data.global_stats.cumulative_chat_messages,
      strToBigInt
    ),
  },
  marketsByEmojiBytes: toSmartTable(data.markets_by_emoji_bytes),
  marketsByMarketID: toSmartTable(data.markets_by_market_id),
  registryAddress: standardizeAddress(data.registry_address),
  sequenceInfo: toParallelizableSequenceInfo(data.sequence_info),
  supplementalChatEmojis: data.supplemental_chat_emojis,
});

export const toPeriodicStateMetadata = (
  data: JsonTypes["PeriodicStateMetadata"]
): Types["PeriodicStateMetadata"] => ({
  startTime: BigInt(data.start_time),
  period: BigInt(data.period),
  emitTime: BigInt(data.emit_time),
  emitMarketNonce: BigInt(data.emit_market_nonce),
  trigger: rawTriggerToEnum(data.trigger),
});

export const toStateMetadata = (data: JsonTypes["StateMetadata"]): Types["StateMetadata"] => ({
  marketNonce: BigInt(data.market_nonce),
  bumpTime: BigInt(data.bump_time),
  trigger: rawTriggerToEnum(data.trigger),
});

export const toSwapEvent = (
  data: JsonTypes["SwapEvent"],
  version: number | string
): Types["SwapEvent"] => ({
  version: Number(version),
  marketID: BigInt(data.market_id),
  time: BigInt(data.time),
  marketNonce: BigInt(data.market_nonce),
  swapper: standardizeAddress(data.swapper),
  inputAmount: BigInt(data.input_amount),
  isSell: data.is_sell,
  integrator: standardizeAddress(data.integrator),
  integratorFeeRateBPs: Number(data.integrator_fee_rate_bps),
  netProceeds: BigInt(data.net_proceeds),
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  avgExecutionPriceQ64: BigInt(data.avg_execution_price_q64),
  integratorFee: BigInt(data.integrator_fee),
  poolFee: BigInt(data.pool_fee),
  startsInBondingCurve: data.starts_in_bonding_curve,
  resultsInStateTransition: data.results_in_state_transition,
  balanceAsFractionOfCirculatingSupplyBeforeQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_before_q64
  ),
  balanceAsFractionOfCirculatingSupplyAfterQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_after_q64
  ),
  guid: `Swap::${data.market_id}::${data.market_nonce}`,
});

export const toChatEvent = (
  data: JsonTypes["ChatEvent"],
  version: number | string
): Types["ChatEvent"] => ({
  version: Number(version),
  marketMetadata: toMarketMetadata(data.market_metadata),
  emitTime: BigInt(data.emit_time),
  emitMarketNonce: BigInt(data.emit_market_nonce),
  user: standardizeAddress(data.user),
  message: data.message,
  userEmojicoinBalance: BigInt(data.user_emojicoin_balance),
  circulatingSupply: BigInt(data.circulating_supply),
  balanceAsFractionOfCirculatingSupplyQ64: BigInt(
    data.balance_as_fraction_of_circulating_supply_q64
  ),
  marketID: BigInt(data.market_metadata.market_id),
  guid: `Chat::${data.market_metadata.market_id}::${data.emit_market_nonce}`,
});

export const toMarketRegistrationEvent = (
  data: JsonTypes["MarketRegistrationEvent"],
  version: number | string
): Types["MarketRegistrationEvent"] => ({
  version: Number(version),
  marketMetadata: toMarketMetadata(data.market_metadata),
  time: BigInt(data.time),
  registrant: standardizeAddress(data.registrant),
  integrator: standardizeAddress(data.integrator),
  integratorFee: BigInt(data.integrator_fee),
  marketID: BigInt(data.market_metadata.market_id),
  guid: `MarketRegistration::${data.market_metadata.market_id}`,
});

export const toPeriodicStateEvent = (
  data: JsonTypes["PeriodicStateEvent"],
  version: number | string
): Types["PeriodicStateEvent"] => ({
  version: Number(version),
  marketMetadata: toMarketMetadata(data.market_metadata),
  periodicStateMetadata: toPeriodicStateMetadata(data.periodic_state_metadata),
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
  marketID: BigInt(data.market_metadata.market_id),
  guid: (`PeriodicState::${data.market_metadata.market_id}::` +
    `${data.periodic_state_metadata.period}::` +
    `${data.periodic_state_metadata.emit_market_nonce}`) as `PeriodicState::${string}`,
});

export const toStateEvent = (
  data: JsonTypes["StateEvent"],
  version: number | string
): Types["StateEvent"] => ({
  version: Number(version),
  marketMetadata: toMarketMetadata(data.market_metadata),
  stateMetadata: toStateMetadata(data.state_metadata),
  clammVirtualReserves: toReserves(data.clamm_virtual_reserves),
  cpammRealReserves: toReserves(data.cpamm_real_reserves),
  lpCoinSupply: BigInt(data.lp_coin_supply),
  cumulativeStats: toCumulativeStats(data.cumulative_stats),
  instantaneousStats: toInstantaneousStats(data.instantaneous_stats),
  lastSwap: toLastSwap(data.last_swap),
  marketID: BigInt(data.market_metadata.market_id),
  guid: `State::${data.market_metadata.market_id}::${data.state_metadata.market_nonce}`,
});

export const toGlobalStateEvent = (
  data: JsonTypes["GlobalStateEvent"],
  version: number | string
): Types["GlobalStateEvent"] => ({
  version: Number(version),
  emitTime: BigInt(data.emit_time),
  registryNonce: fromAggregatorSnapshot(data.registry_nonce, strToBigInt),
  trigger: rawTriggerToEnum(data.trigger),
  cumulativeQuoteVolume: fromAggregatorSnapshot(data.cumulative_quote_volume, strToBigInt),
  totalQuoteLocked: fromAggregatorSnapshot(data.total_quote_locked, strToBigInt),
  totalValueLocked: fromAggregatorSnapshot(data.total_value_locked, strToBigInt),
  marketCap: fromAggregatorSnapshot(data.market_cap, strToBigInt),
  fullyDilutedValue: fromAggregatorSnapshot(data.fully_diluted_value, strToBigInt),
  cumulativeIntegratorFees: fromAggregatorSnapshot(data.cumulative_integrator_fees, strToBigInt),
  cumulativeSwaps: fromAggregatorSnapshot(data.cumulative_swaps, strToBigInt),
  cumulativeChatMessages: fromAggregatorSnapshot(data.cumulative_chat_messages, strToBigInt),
  guid: `GlobalState::${data.registry_nonce.value}`,
});

export const toLiquidityEvent = (
  data: JsonTypes["LiquidityEvent"],
  version: number | string
): Types["LiquidityEvent"] => ({
  version: Number(version),
  marketID: BigInt(data.market_id),
  time: BigInt(data.time),
  marketNonce: BigInt(data.market_nonce),
  provider: standardizeAddress(data.provider),
  baseAmount: BigInt(data.base_amount),
  quoteAmount: BigInt(data.quote_amount),
  lpCoinAmount: BigInt(data.lp_coin_amount),
  liquidityProvided: data.liquidity_provided,
  baseDonationClaimAmount: BigInt(data.base_donation_claim_amount),
  quoteDonationClaimAmount: BigInt(data.quote_donation_claim_amount),
  guid: `Liquidity::${data.market_id}::${data.market_nonce}`,
});

export const toRegistrantGracePeriodFlag = (data: JsonTypes["RegistrantGracePeriodFlag"]) => ({
  marketRegistrant: standardizeAddress(data.market_registrant),
  marketRegistrationTime: BigInt(data.market_registration_time),
});

export const toEmojicoinDotFunRewards = (
  data: JsonTypes["EmojicoinDotFunRewards"],
  version: number | string
) => ({
  swap: toSwapEvent(data.swap, version),
  octasRewardAmount: BigInt(data.octas_reward_amount),
});

export type AnyContractType =
  | Types["ExtendRef"]
  | Types["SequenceInfo"]
  | Types["TVLtoLPCoinRatio"]
  | Types["PeriodicStateTracker"]
  | Types["RegistryAddress"]
  | Types["RegistryView"]
  | Types["MarketView"]
  | Types["Market"]
  | Types["MarketMetadata"]
  | Types["Reserves"]
  | Types["PeriodicStateMetadata"]
  | Types["StateMetadata"]
  | Types["CumulativeStats"]
  | Types["InstantaneousStats"]
  | Types["LastSwap"]
  | Types["SwapEvent"]
  | Types["ChatEvent"]
  | Types["MarketRegistrationEvent"]
  | Types["PeriodicStateEvent"]
  | Types["StateEvent"]
  | Types["GlobalStateEvent"]
  | Types["LiquidityEvent"]
  | Types["RegistrantGracePeriodFlag"];

export type AnyEmojicoinEvent =
  | Types["SwapEvent"]
  | Types["ChatEvent"]
  | Types["MarketRegistrationEvent"]
  | Types["PeriodicStateEvent"]
  | Types["StateEvent"]
  | Types["GlobalStateEvent"]
  | Types["LiquidityEvent"];

/**
 * Event types that can all be part of a single market and placed into a typed homogenous structure.
 * @see HomogenousContractEvents in sdk/src/emojicoin_dot_fun/events.ts
 */
export type AnyHomogenousEvent =
  | Types["SwapEvent"]
  | Types["ChatEvent"]
  | Types["PeriodicStateEvent"]
  | Types["StateEvent"]
  | Types["LiquidityEvent"];

export type AnyEmojicoinEventName =
  | `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::Swap`
  | `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::Chat`
  | `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::MarketRegistration`
  | `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::PeriodicState`
  | `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::State`
  | `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::GlobalState`
  | `${typeof EMOJICOIN_DOT_FUN_MODULE_NAME}::Liquidity`;

export function isSwapEvent(e: AnyEmojicoinEvent): e is Types["SwapEvent"] {
  return e.guid.startsWith("Swap");
}
export function isChatEvent(e: AnyEmojicoinEvent): e is Types["ChatEvent"] {
  return e.guid.startsWith("Chat");
}
export function isMarketRegistrationEvent(
  e: AnyEmojicoinEvent
): e is Types["MarketRegistrationEvent"] {
  return e.guid.startsWith("MarketRegistration");
}
export function isPeriodicStateEvent(e: AnyEmojicoinEvent): e is Types["PeriodicStateEvent"] {
  return e.guid.startsWith("PeriodicState");
}
export function isStateEvent(e: AnyEmojicoinEvent): e is Types["StateEvent"] {
  return e.guid.startsWith("State");
}
export function isGlobalStateEvent(e: AnyEmojicoinEvent): e is Types["GlobalStateEvent"] {
  return e.guid.startsWith("GlobalState");
}
export function isLiquidityEvent(e: AnyEmojicoinEvent): e is Types["LiquidityEvent"] {
  return e.guid.startsWith("Liquidity");
}

// Unfortunately, we can't use classes with server components or `immer` easily, so we have to write
// helper functions like these.
export function getEmojicoinEventTime(e: AnyEmojicoinEvent): bigint {
  if (isSwapEvent(e)) return e.time;
  if (isChatEvent(e)) return e.emitTime;
  if (isMarketRegistrationEvent(e)) return e.time;
  if (isPeriodicStateEvent(e)) return e.periodicStateMetadata.emitTime;
  if (isStateEvent(e)) return e.stateMetadata.bumpTime;
  if (isGlobalStateEvent(e)) return e.emitTime;
  if (isLiquidityEvent(e)) return e.time;
  throw new Error(`Unknown event type: ${e}`);
}

export function toEventWithTime<T extends AnyEmojicoinEvent>(e: T): T & WithTime {
  return {
    ...e,
    time: getEmojicoinEventTime(e),
  };
}

export function getEventTypeName(e: AnyEmojicoinEvent): EventName {
  if (isSwapEvent(e)) return "Swap";
  if (isChatEvent(e)) return "Chat";
  if (isMarketRegistrationEvent(e)) return "MarketRegistration";
  if (isPeriodicStateEvent(e)) return "PeriodicState";
  if (isStateEvent(e)) return "State";
  if (isGlobalStateEvent(e)) return "GlobalState";
  if (isLiquidityEvent(e)) return "Liquidity";
  throw new Error(`Unknown event type: ${e}`);
}

export interface WithTime {
  time: bigint;
}

export function toEmojicoinEvent(
  type: (typeof STRUCT_STRINGS)[keyof typeof STRUCT_STRINGS],
  data: AnyEmojicoinJSONEvent,
  version?: number
): AnyEmojicoinEvent {
  const event = { type, data };
  if (isJSONSwapEvent(event)) return toSwapEvent(data as JsonTypes["SwapEvent"], version ?? -1);
  if (isJSONChatEvent(event)) return toChatEvent(data as JsonTypes["ChatEvent"], version ?? -1);
  if (isJSONMarketRegistrationEvent(event))
    return toMarketRegistrationEvent(data as JsonTypes["MarketRegistrationEvent"], version ?? -1);
  if (isJSONPeriodicStateEvent(event))
    return toPeriodicStateEvent(data as JsonTypes["PeriodicStateEvent"], version ?? -1);
  if (isJSONStateEvent(event)) return toStateEvent(data as JsonTypes["StateEvent"], version ?? -1);
  if (isJSONGlobalStateEvent(event))
    return toGlobalStateEvent(data as JsonTypes["GlobalStateEvent"], version ?? -1);
  if (isJSONLiquidityEvent(event))
    return toLiquidityEvent(data as JsonTypes["LiquidityEvent"], version ?? -1);
  throw new Error(`Unknown event type: ${type}`);
}
