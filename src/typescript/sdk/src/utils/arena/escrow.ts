import {
  type TypeTagStruct,
  parseTypeTag,
  type Aptos,
  type UserTransactionResponse,
  type MoveResource,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";
import { type ArenaJsonTypes } from "../../types/arena-json-types";
import { getAccountResourcesWithInfo, getAptosClient } from "../aptos-client";
import { type OptionType, collectSome, None, Option } from "../option";
import { STRUCT_STRINGS } from "../type-tags";
import { toEscrowResource } from "../../types/arena-types";
import {
  type StandardizedAddress,
  isWriteSetChangeWriteResource,
  type MeleeID,
  type AnyNumberString,
} from "../../types";
import { toStandardizedAddress } from "../account-address";

const isEscrowStruct = ({ value }: TypeTagStruct) => {
  const { address, moduleName, name } = value;
  const structString = [address.toString(), moduleName.identifier, name.identifier].join("::");
  return STRUCT_STRINGS["Escrow"] === structString;
};

export type UserEscrow = {
  version: bigint;
  user: StandardizedAddress;
  meleeID: MeleeID;
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
  address: StandardizedAddress;
  version: AnyNumberString;
  data: T;
}): OptionType<UserEscrow> => {
  const { type } = resource;
  if (isEscrowResource(resource)) {
    const escrow = toEscrowResource(resource);
    const typeTag = parseTypeTag(type);
    if (typeTag.isStruct() && isEscrowStruct(typeTag)) {
      const innerTags = typeTag.value.typeArgs;
      if (innerTags.every((v) => v.isStruct()) && innerTags.length === 4) {
        return Option({
          ...escrow,
          user: address,
          version: BigInt(version),
          coinTypes: innerTags as [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct],
        });
      }
    }
  }

  return None();
};

export const findEscrowsInTxn = ({ version, changes }: UserTransactionResponse) =>
  changes
    .filter(isWriteSetChangeWriteResource)
    .filter(isEscrowWritesetChange)
    .map(({ address, data }) =>
      parseResourceForEscrow({
        address: toStandardizedAddress(address),
        version,
        data,
      }).expect("Escrow should exist.")
    );

/**
 * Fetch all Escrow resources the user owns.
 */
export const fetchUserArenaEscrows = async (
  accountAddress: StandardizedAddress,
  aptosIn: Aptos = getAptosClient()
) =>
  await getAccountResourcesWithInfo({
    aptosConfig: aptosIn?.config,
    accountAddress,
  }).then((resources) =>
    collectSome(
      resources
        .map((resource) => ({ address: accountAddress, ...resource }))
        .map(parseResourceForEscrow)
    )
  );
