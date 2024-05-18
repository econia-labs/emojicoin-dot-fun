/* eslint-disable import/no-unused-modules */
import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  Hex,
  type TypeTag,
  type Uint128,
  type Uint64,
  parseTypeTag,
  type Uint8,
} from "@aptos-labs/ts-sdk";
import { type ExtendRef, type SequenceInfo } from "./core";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "../emojicoin_dot_fun/consts";

// Structs specific to `emojicoin_dot_fun`.

export const isMarketMetadata = (v: any): v is MarketMetadata =>
  typeof v.marketId === "bigint" &&
  v.marketAddress instanceof AccountAddress &&
  v.emojiBytes instanceof Hex;

export type MarketMetadata = {
  marketId: Uint64;
  marketAddress: AccountAddress;
  emojiBytes: Hex;
};

export const toMarketMetadata = (data: {
  market_id: string;
  market_address: string;
  emoji_bytes: string;
}): MarketMetadata => ({
  marketId: BigInt(data.market_id),
  marketAddress: AccountAddress.from(data.market_address),
  emojiBytes: Hex.fromHexString(data.emoji_bytes),
});

export type MarketResource = {
  metadata: MarketMetadata;
  sequenceInfo: SequenceInfo;
  extendRef: ExtendRef;
  clammVirtualReserves: Reserves;
  cpammRealReserves: Reserves;
  lpCoinSupply: Uint128;
};

export type Reserves = {
  base: Uint64;
  quote: Uint64;
};

export const toReserves = (data: { base: string; quote: string }): Reserves => ({
  base: BigInt(data.base),
  quote: BigInt(data.quote),
});

export async function getMarketResource(args: {
  aptos: Aptos;
  moduleAddress: AccountAddressInput;
  objectAddress: AccountAddressInput;
}): Promise<MarketResource> {
  const { aptos } = args;
  const moduleAddress = AccountAddress.from(args.moduleAddress);
  const objectAddress = AccountAddress.from(args.objectAddress);
  const marketResource = await aptos.getAccountResource({
    accountAddress: objectAddress,
    resourceType: `${moduleAddress.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::Market`,
  });
  return {
    metadata: {
      marketId: BigInt(marketResource.metadata.market_id),
      marketAddress: AccountAddress.from(marketResource.metadata.market_address),
      emojiBytes: Hex.fromHexString(marketResource.metadata.emoji_bytes),
    },
    sequenceInfo: {
      nonce: BigInt(marketResource.sequence_info.nonce),
      last_bump_time: BigInt(marketResource.sequence_info.last_bump_time),
    },
    extendRef: {
      self: AccountAddress.from(marketResource.extend_ref.self),
    },
    clammVirtualReserves: {
      base: BigInt(marketResource.clamm_virtual_reserves.base),
      quote: BigInt(marketResource.clamm_virtual_reserves.quote),
    },
    cpammRealReserves: {
      base: BigInt(marketResource.cpamm_real_reserves.base),
      quote: BigInt(marketResource.cpamm_real_reserves.quote),
    },
    lpCoinSupply: BigInt(marketResource.lp_coin_supply),
  };
}

export type ChatEvent = {
  market_metadata: MarketMetadata;
  emit_time: Uint64;
  emit_market_nonce: Uint64;
  user: AccountAddress;
  message: string;
  user_emojicoin_balance: Uint64;
  circulating_supply: Uint64;
  balance_as_fraction_of_circulating_supply_q64: Uint128;
};

export const chatEventTypeTag = (): TypeTag =>
  parseTypeTag(`${MODULE_ADDRESS.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::Chat`);

export const parseChatEvent = (data: any): ChatEvent => ({
  market_metadata: toMarketMetadata(data.market_metadata),
  emit_time: BigInt(data.emit_time),
  emit_market_nonce: BigInt(data.emit_market_nonce),
  user: data.user,
  message: data.message,
  user_emojicoin_balance: BigInt(data.user_emojicoin_balance),
  circulating_supply: BigInt(data.circulating_supply),
  balance_as_fraction_of_circulating_supply_q64: BigInt(
    data.balance_as_fraction_of_circulating_supply_q64
  ),
});

export type EmojicoinInfo = {
  marketAddress: AccountAddress;
  emojicoin: TypeTag;
  emojicoinLP: TypeTag;
};

export const toPeriodicStateMetadata = (data: {
  start_time: string;
  period: string;
  emit_time: string;
  emit_market_nonce: string;
  trigger: string;
}): PeriodicStateMetadata => ({
  startTime: BigInt(data.start_time),
  period: BigInt(data.period),
  emitTime: BigInt(data.emit_time),
  emitMarketNonce: BigInt(data.emit_market_nonce),
  trigger: Number(data.trigger),
});

export type PeriodicStateMetadata = {
  startTime: Uint64;
  period: Uint64;
  emitTime: Uint64;
  emitMarketNonce: Uint64;
  trigger: Uint8;
};

export type StateMetadata = {
  marketNonce: Uint64;
  bumpTime: Uint64;
  trigger: Uint8;
};
export type CumulativeStats = {
  baseVolume: Uint128;
  quoteVolume: Uint128;
  integratorFees: Uint128;
  poolFeesBase: Uint128;
  poolFeesQuote: Uint128;
  nSwaps: Uint64;
  nChatMessages: Uint64;
};
export type InstantaneousStats = {
  totalQuoteLocked: Uint64;
  totalValueLocked: Uint128;
  marketCap: Uint128;
  fullyDilutedValue: Uint128;
};
export type LastSwap = {
  isSell: boolean;
  avgExecutionPriceQ64: Uint128;
  baseVolume: Uint64;
  quoteVolume: Uint64;
  nonce: Uint64;
  time: Uint64;
};

export const toStateMetadata = (data: {
  market_nonce: string;
  bump_time: string;
  trigger: string;
}) => ({
  marketNonce: BigInt(data.market_nonce),
  bumpTime: BigInt(data.bump_time),
  trigger: Number(data.trigger),
});

export const toCumulativeStats = (data: {
  base_volume: string;
  quote_volume: string;
  integrator_fees: string;
  pool_fees_base: string;
  pool_fees_quote: string;
  n_swaps: string;
  n_chat_messages: string;
}) => ({
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  integratorFees: BigInt(data.integrator_fees),
  poolFeesBase: BigInt(data.pool_fees_base),
  poolFeesQuote: BigInt(data.pool_fees_quote),
  nSwaps: BigInt(data.n_swaps),
  nChatMessages: BigInt(data.n_chat_messages),
});

export const toInstantaneousStats = (data: {
  total_quote_locked: string;
  total_value_locked: string;
  market_cap: string;
  fully_diluted_value: string;
}) => ({
  totalQuoteLocked: BigInt(data.total_quote_locked),
  totalValueLocked: BigInt(data.total_value_locked),
  marketCap: BigInt(data.market_cap),
  fullyDilutedValue: BigInt(data.fully_diluted_value),
});

export const toLastSwap = (data: {
  is_sell: boolean;
  avg_execution_price_q64: string;
  base_volume: string;
  quote_volume: string;
  nonce: string;
  time: string;
}) => ({
  isSell: data.is_sell,
  avgExecutionPriceQ64: BigInt(data.avg_execution_price_q64),
  baseVolume: BigInt(data.base_volume),
  quoteVolume: BigInt(data.quote_volume),
  nonce: BigInt(data.nonce),
  time: BigInt(data.time),
});

export const toAggregatorSnapshot = (data: { value: string }) => BigInt(data.value);

/**
 * @see emojicoin_dot_fun.move
 * struct RegistryView has drop, store {
 *     registry_address: address,
 *     nonce: AggregatorSnapshot<u64>,
 *     last_bump_time: u64,
 *     n_markets: u64,
 *     cumulative_quote_volume: AggregatorSnapshot<u128>,
 *     total_quote_locked: AggregatorSnapshot<u128>,
 *     total_value_locked: AggregatorSnapshot<u128>,
 *     market_cap: AggregatorSnapshot<u128>,
 *     fully_diluted_value: AggregatorSnapshot<u128>,
 *     cumulative_integrator_fees: AggregatorSnapshot<u128>,
 *     cumulative_swaps: AggregatorSnapshot<u64>,
 *     cumulative_chat_messages: AggregatorSnapshot<u64>,
 * }
 */
export type RegistryViewData = {
  registryAddress: AccountAddress;
  nonce: Uint64;
  lastBumpTime: Uint64;
  nMarkets: Uint64;
  cumulativeQuoteVolume: Uint128;
  totalQuoteLocked: Uint128;
  totalValueLocked: Uint128;
  marketCap: Uint128;
  fullyDilutedValue: Uint128;
  cumulativeIntegratorFees: Uint128;
  cumulativeSwaps: Uint128;
  cumulativeChatMessages: Uint128;
};

export const toRegistryViewData = (data: any): RegistryViewData => ({
  registryAddress: AccountAddress.from(data.registry_address),
  nonce: toAggregatorSnapshot(data.nonce),
  lastBumpTime: BigInt(data.last_bump_time),
  nMarkets: BigInt(data.n_markets),
  cumulativeQuoteVolume: toAggregatorSnapshot(data.cumulative_quote_volume),
  totalQuoteLocked: toAggregatorSnapshot(data.total_quote_locked),
  totalValueLocked: toAggregatorSnapshot(data.total_value_locked),
  marketCap: toAggregatorSnapshot(data.market_cap),
  fullyDilutedValue: toAggregatorSnapshot(data.fully_diluted_value),
  cumulativeIntegratorFees: toAggregatorSnapshot(data.cumulative_integrator_fees),
  cumulativeSwaps: toAggregatorSnapshot(data.cumulative_swaps),
  cumulativeChatMessages: toAggregatorSnapshot(data.cumulative_chat_messages),
});
