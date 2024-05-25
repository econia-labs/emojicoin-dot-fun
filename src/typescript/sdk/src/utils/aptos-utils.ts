/* eslint-disable import/no-unused-modules */
import {
  Aptos,
  type AptosConfig,
  type AccountAddressInput,
  type HexInput,
  AccountAddress,
  Hex,
  DeriveScheme,
} from "@aptos-labs/ts-sdk";
import { sha3_256 } from "@noble/hashes/sha3";

export function toAptos(aptos: Aptos | AptosConfig): Aptos {
  return aptos instanceof Aptos ? aptos : new Aptos(aptos);
}

export function toConfig(aptos: Aptos | AptosConfig): AptosConfig {
  return aptos instanceof Aptos ? aptos.config : aptos;
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

export const truncateAddress = (input: AccountAddressInput): string => {
  const t = AccountAddress.from(input);
  const s = t.toString();
  return `${s.substring(0, 6)}...${s.substring(s.length - 4, s.length)}`;
};
