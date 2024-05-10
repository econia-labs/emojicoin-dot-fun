import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  Hex,
  type TypeTag,
  type Uint128,
  type Uint64,
  parseTypeTag,
} from "@aptos-labs/ts-sdk";
import { type ExtendRef, type SequenceInfo } from "./core";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "../emojicoin_dot_fun";

// Structs specific to `emojicoin_dot_fun`.

export type MarketMetadata = {
  market_id: Uint64;
  market_address: AccountAddress;
  emoji_bytes: Hex;
};

export type MarketResource = {
  metadata: MarketMetadata;
  sequence_info: SequenceInfo;
  extend_ref: ExtendRef;
  clamm_virtual_reserves: Reserves;
  cpamm_real_reserves: Reserves;
  lp_coin_supply: Uint128;
};

export type Reserves = {
  base: Uint64;
  quote: Uint64;
};

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
      market_id: BigInt(marketResource.metadata.market_id),
      market_address: AccountAddress.from(marketResource.metadata.market_address),
      emoji_bytes: Hex.fromHexString(marketResource.metadata.emoji_bytes),
    },
    sequence_info: {
      nonce: BigInt(marketResource.sequence_info.nonce),
      last_bump_time: BigInt(marketResource.sequence_info.last_bump_time),
    },
    extend_ref: {
      self: AccountAddress.from(marketResource.extend_ref.self),
    },
    clamm_virtual_reserves: {
      base: BigInt(marketResource.clamm_virtual_reserves.base),
      quote: BigInt(marketResource.clamm_virtual_reserves.quote),
    },
    cpamm_real_reserves: {
      base: BigInt(marketResource.cpamm_real_reserves.base),
      quote: BigInt(marketResource.cpamm_real_reserves.quote),
    },
    lp_coin_supply: BigInt(marketResource.lp_coin_supply),
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

export const toMarketMetadata = (data: {
  market_id: string;
  market_address: string;
  emoji_bytes: string;
}): MarketMetadata => ({
  market_id: BigInt(data.market_id),
  market_address: AccountAddress.from(data.market_address),
  emoji_bytes: Hex.fromHexString(data.emoji_bytes),
});

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

export type MarketView = {};

// export const toMarketView = (data: {}): MarketView => ({});

export type EmojicoinInfo = {
  marketAddress: AccountAddress;
  emojicoin: TypeTag;
  emojicoinLP: TypeTag;
};
