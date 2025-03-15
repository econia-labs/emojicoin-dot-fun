import {
  type TypeTagStruct,
  parseTypeTag,
  type AccountAddressInput,
  type Aptos,
  AccountAddress,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { type ArenaJsonTypes } from "../../types/arena-json-types";
import { getAccountResourcesWithInfo } from "../aptos-client";
import { type OptionType, None, Option } from "../option";
import { STRUCT_STRINGS } from "../type-tags";
import { toEscrowResource } from "../../types/arena-types";
import { type Address, isWriteSetChangeWriteResource, type MeleeID } from "../../types";

const isEscrowStruct = ({ value }: TypeTagStruct) => {
  const { address, moduleName, name } = value;
  const structString = [address.toString(), moduleName.identifier, name.identifier].join("::");
  return STRUCT_STRINGS["Escrow"] === structString;
};

type Escrow = {
  meleeID: bigint;
  emojicoin0: bigint;
  emojicoin1: bigint;
  matchAmount: bigint;
  coinTypes: [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct];
};

export const isEscrowResource = (resource: {
  data: unknown;
  type: string;
}): resource is ArenaJsonTypes["Escrow"] =>
  /^0x([a-zA-Z0-9])+::emojicoin_arena::Escrow<0x.*LP>$/.test(resource.type);

export const parseResourceForEscrow = (resource: {
  data: unknown;
  type: string;
}): OptionType<Escrow> => {
  const { type } = resource;
  if (isEscrowResource(resource)) {
    const escrow = toEscrowResource(resource);
    const typeTag = parseTypeTag(type);
    if (typeTag.isStruct() && isEscrowStruct(typeTag)) {
      const innerTags = typeTag.value.typeArgs;
      if (innerTags.every((v) => v.isStruct()) && innerTags.length === 4) {
        return Option({
          ...escrow,
          coinTypes: innerTags as [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct],
        });
      }
    }
  }

  return None();
};

export const findEscrows = (
  response: UserTransactionResponse
): { meleeID: MeleeID; user: Address; escrow: Escrow }[] =>
  response.changes
    .filter(isWriteSetChangeWriteResource)
    .filter((v) => isEscrowResource(v))
    .map(({ address, data, type }) => ({
      meleeID: data.melee_id as MeleeID,
      user: AccountAddress.from(address).toString() as Address,
      escrow: parseResourceForEscrow({ data, type }).expect("Escrow should exist."),
    }));

/**
 * Fetch all Escrow resources the user owns.
 */
export const fetchUserArenaEscrows = async (user: AccountAddressInput, aptosIn?: Aptos) => {
  const resources = await getAccountResourcesWithInfo({
    aptosConfig: aptosIn?.config,
    accountAddress: user,
  });
  return resources
    .map((r) =>
      parseResourceForEscrow(r.data).map((escrow) => ({
        version: r.version,
        timestamp: r.timestamp,
        escrow,
      }))
    )
    .filter((v) => v.isSome())
    .map((v) => v.unwrap());
};
