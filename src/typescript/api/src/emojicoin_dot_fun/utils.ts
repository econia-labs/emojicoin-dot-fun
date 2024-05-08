import {
  AccountAddress,
  type AccountAddressInput,
  type Aptos,
  Hex,
  type HexInput,
  type Uint64,
  type Uint128,
  DeriveScheme,
} from "@aptos-labs/ts-sdk";
import { sha3_256 } from "@noble/hashes/sha3";
import { EMOJICOIN_DOT_FUN_MODULE_NAME } from "./consts";

/**
 * Sleep the current thread for the given amount of time
 * @param timeMs time in milliseconds to sleep
 */
export async function sleep(timeMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

/**
 * Derives the object address from the given emoji hex codes vector<u8> seed and
 * the given object creator.
 */
export function deriveEmojicoinPublisherAddress(args: {
  registryAddress: AccountAddress;
  emojis: Array<string>;
}): AccountAddress {
  const { emojis, registryAddress } = args;
  const hexStringBytes = emojis
    .map((emoji) => Hex.fromHexString(emoji).toStringWithoutPrefix())
    .join("");
  const seed = Hex.fromHexString(hexStringBytes).toUint8Array();
  return createNamedObjectAddress({
    creator: registryAddress,
    seed,
  });
}

export function createNamedObjectAddress(args: {
  creator: AccountAddressInput;
  seed: HexInput;
}): AccountAddress {
  const creatorAddress = AccountAddress.from(args.creator);
  const seed = Hex.fromHexInput(args.seed).toUint8Array();
  const serializedCreatorAddress = creatorAddress.bcsToBytes();
  const preImage = new Uint8Array([
    ...serializedCreatorAddress,
    ...seed,
    DeriveScheme.DeriveObjectAddressFromSeed,
  ]);

  return AccountAddress.from(sha3_256(preImage));
}

export async function getRegistryAddress(args: {
  aptos: Aptos;
  moduleAddress: AccountAddressInput;
}): Promise<AccountAddress> {
  const { aptos } = args;
  const moduleAddress = AccountAddress.from(args.moduleAddress);
  const registryAddressResource = await aptos.getAccountResource({
    accountAddress: moduleAddress,
    resourceType: `${moduleAddress.toString()}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::RegistryAddress`,
  });
  return registryAddressResource.registry_address;
}

export type MarketMetadata = {
  market_id: Uint64;
  market_address: AccountAddress;
  emoji_bytes: Hex;
};

export type SequenceInfo = {
  nonce: Uint64;
  last_bump_time: Uint64;
};

export type MarketResource = {
  metadata: MarketMetadata;
  sequence_info: SequenceInfo;
  extend_ref: ExtendRef;
  clamm_virtual_reserves: Reserves;
  cpamm_real_reserves: Reserves;
  lp_coin_supply: Uint128;
};

export type ExtendRef = {
  self: AccountAddress;
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
