import {
  AccountAddress,
  type AccountAddressInput,
  Aptos,
  Hex,
  type HexInput,
  DeriveScheme,
  type AptosConfig,
} from "@aptos-labs/ts-sdk";
import { sha3_256 } from "@noble/hashes/sha3";
import { COIN_FACTORY_MODULE_NAME, EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "./consts";

/**
 * Sleep the current thread for the given amount of time
 * @param timeMs time in milliseconds to sleep
 */
export async function sleep(timeMs: number): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeMs);
  });
}

export function toAptos(aptos: Aptos | AptosConfig): Aptos {
  return aptos instanceof Aptos ? aptos : new Aptos(aptos);
}

export function toConfig(aptos: Aptos | AptosConfig): AptosConfig {
  return aptos instanceof Aptos ? aptos.config : aptos;
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
