import {
  type MoveResource,
  parseTypeTag,
  type TypeTagStruct,
  type UserTransactionResponse,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";

import {
  type ArenaInfoModel,
  type ArenaLeaderboardHistoryWithArenaInfoModel,
  type ArenaPositionModel,
  maxBigInt,
  toArenaCoinTypes,
  toCoinTypeString,
} from "../..";
import type { AccountAddressString } from "../../emojicoin_dot_fun/types";
import { type AnyNumberString, isWriteSetChangeWriteResource } from "../../types";
import type { ArenaJsonTypes } from "../../types/arena-json-types";
import { toEscrowResource } from "../../types/arena-types";
import { toAccountAddressString } from "../account-address";
import { type CoinTypeString, STRUCT_STRINGS } from "../type-tags";

const isEscrowStruct = ({ value }: TypeTagStruct) => {
  const { address, moduleName, name } = value;
  const structString = [address.toString(), moduleName.identifier, name.identifier].join("::");
  return STRUCT_STRINGS["Escrow"] === structString;
};

export type UserEscrow = {
  version: bigint;
  user: `0x${string}`;
  meleeID: bigint;
  emojicoin0: bigint;
  emojicoin1: bigint;
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
    const { meleeID, emojicoin0, emojicoin1 } = toEscrowResource(resource);
    const typeTag = parseTypeTag(type);
    if (typeTag.isStruct() && isEscrowStruct(typeTag)) {
      const innerTags = typeTag.value.typeArgs;
      if (innerTags.every((v) => v.isStruct()) && innerTags.length === 4) {
        return {
          meleeID,
          emojicoin0,
          emojicoin1,
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

type PositionAndInfo = ArenaPositionModel & ArenaInfoModel;
type ArenaCoinTypeStructs = [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct];

// Convert each user's current and historical positions to `UserEscrow` types.
export const positionToUserEscrow = (
  pos: PositionAndInfo | ArenaLeaderboardHistoryWithArenaInfoModel
): UserEscrow => {
  if ("version" in pos && "open" in pos) {
    return {
      version: pos.version,
      user: pos.user,
      meleeID: pos.meleeID,
      emojicoin0: pos.emojicoin0Balance,
      emojicoin1: pos.emojicoin1Balance,
      coinTypes: toArenaCoinTypes({
        symbol0: pos.emojicoin0Symbols,
        symbol1: pos.emojicoin1Symbols,
      }).filter((t) => t.isStruct()) as ArenaCoinTypeStructs,
    };
  }

  return {
    version: maxBigInt(
      pos.arenaInfoLastTransactionVersion,
      pos.leaderboardHistoryLastTransactionVersion
    ),
    user: pos.user,
    meleeID: pos.meleeID,
    emojicoin0: pos.emojicoin0Balance,
    emojicoin1: pos.emojicoin1Balance,
    coinTypes: toArenaCoinTypes({
      symbol0: pos.emojicoin0Symbols,
      symbol1: pos.emojicoin1Symbols,
    }).filter((t) => t.isStruct()) as ArenaCoinTypeStructs,
  };
};

export type UserEscrowJson = {
  version: string;
  user: `0x${string}`;
  meleeID: string;
  emojicoin0: string;
  emojicoin1: string;
  coinTypes: [CoinTypeString, CoinTypeString, CoinTypeString, CoinTypeString];
};

export function toUserEscrowJson({
  version,
  user,
  meleeID,
  emojicoin0,
  emojicoin1,
  coinTypes,
}: UserEscrow): UserEscrowJson {
  return {
    version: version.toString(),
    user: user.toString() as `0x${string}`,
    meleeID: meleeID.toString(),
    emojicoin0: emojicoin0.toString(),
    emojicoin1: emojicoin1.toString(),
    coinTypes: coinTypes.map(toCoinTypeString) as [
      CoinTypeString,
      CoinTypeString,
      CoinTypeString,
      CoinTypeString,
    ],
  };
}

export function fromUserEscrowJson({
  version,
  user,
  meleeID,
  emojicoin0,
  emojicoin1,
  coinTypes,
}: UserEscrowJson): UserEscrow {
  return {
    version: BigInt(version),
    user,
    meleeID: BigInt(meleeID),
    emojicoin0: BigInt(emojicoin0),
    emojicoin1: BigInt(emojicoin1),
    coinTypes: coinTypes.map((s) => parseTypeTag(s)).filter((t) => t.isStruct()) as [
      TypeTagStruct,
      TypeTagStruct,
      TypeTagStruct,
      TypeTagStruct,
    ],
  };
}
