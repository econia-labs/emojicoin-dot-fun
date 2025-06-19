/* eslint-disable import/no-unused-modules */
import {
  AccountAddress,
  type AccountAddressInput,
  Aptos,
  type AptosConfig,
  DeriveScheme,
  Hex,
  type HexInput,
} from "@aptos-labs/ts-sdk";
import { sha3_256 } from "@noble/hashes/sha3";

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

export function createUserDerivedObjectAddress({
  source,
  deriveFrom,
}: {
  source: AccountAddressInput;
  deriveFrom: AccountAddressInput;
}) {
  const preImage = new Uint8Array([
    ...AccountAddress.from(source).bcsToBytes(),
    ...AccountAddress.from(deriveFrom).bcsToBytes(),
    DeriveScheme.DeriveObjectAddressFromObject,
  ]);
  return AccountAddress.from(sha3_256(preImage));
}

export function getPrimaryFungibleStoreAddress({
  ownerAddress,
  metadataAddress,
}: {
  ownerAddress: AccountAddressInput;
  metadataAddress: AccountAddressInput;
}) {
  return createUserDerivedObjectAddress({ source: ownerAddress, deriveFrom: metadataAddress });
}
