import {
  type Aptos,
  type MoveResource,
  parseTypeTag,
  type TypeTagStruct,
  type UserTransactionResponse,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";

import type { AccountAddressString } from "../../emojicoin_dot_fun/types";
import { type AnyNumberString, isWriteSetChangeWriteResource } from "../../types";
import type { ArenaJsonTypes } from "../../types/arena-json-types";
import { toEscrowResource } from "../../types/arena-types";
import { toAccountAddressString } from "../account-address";
import { getAccountResourcesWithInfo } from "../account-resources";
import { getAptosClient } from "../aptos-client";
import { STRUCT_STRINGS } from "../type-tags";

const isEscrowStruct = ({ value }: TypeTagStruct) => {
  const { address, moduleName, name } = value;
  const structString = [address.toString(), moduleName.identifier, name.identifier].join("::");
  return STRUCT_STRINGS["Escrow"] === structString;
};

export type UserEscrow = {
  version: bigint;
  user: AccountAddressString;
  meleeID: bigint;
  emojicoin0: bigint;
  emojicoin1: bigint;
  matchAmount: bigint;
  coinTypes: [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct];
};

export const isEscrowResource = (resource: MoveResource): resource is ArenaJsonTypes["Escrow"] =>
  /^0x([a-zA-Z0-9])+::emojicoin_arena::Escrow<0x.*LP>$/.test(resource.type);

export const isEscrowWritesetChange = (
  change: WriteSetChangeWriteResource
): change is WriteSetChangeWriteResource & {
  data: ArenaJsonTypes["Escrow"];
} => {
  return isEscrowResource(change.data);
};

export const parseResourceForEscrow = <T extends MoveResource>({
  address,
  version,
  data: resource,
}: {
  address: AccountAddressString;
  version: AnyNumberString;
  data: T;
}): UserEscrow | null => {
  const { type } = resource;
  if (isEscrowResource(resource)) {
    const escrow = toEscrowResource(resource);
    const typeTag = parseTypeTag(type);
    if (typeTag.isStruct() && isEscrowStruct(typeTag)) {
      const innerTags = typeTag.value.typeArgs;
      if (innerTags.every((v) => v.isStruct()) && innerTags.length === 4) {
        return {
          ...escrow,
          user: address,
          version: BigInt(version),
          coinTypes: innerTags as [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct],
        };
      }
    }
  }

  return null;
};

export const findEscrowsInTxn = ({ version, changes }: UserTransactionResponse) =>
  changes
    .filter(isWriteSetChangeWriteResource)
    .filter(isEscrowWritesetChange)
    .map(({ address, data }) =>
      parseResourceForEscrow({
        address: toAccountAddressString(address),
        version,
        data,
      })
    )
    .filter((v) => !!v);

/**
 * Fetch all Escrow resources the user owns.
 */
export const fetchUserArenaEscrows = async (
  accountAddress: AccountAddressString,
  aptosIn: Aptos = getAptosClient()
) =>
  await getAccountResourcesWithInfo({
    aptosConfig: aptosIn?.config,
    accountAddress,
  }).then((resources) =>
    resources
      .map((resource) => ({ address: accountAddress, ...resource }))
      .map(parseResourceForEscrow)
      .filter((v) => !!v)
  );
