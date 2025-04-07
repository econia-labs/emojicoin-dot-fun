import {
  type MoveResource,
  parseTypeTag,
  type TypeTagStruct,
  type UserTransactionResponse,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";

import type { ArenaLeaderboardHistoryWithArenaInfoModel, Flatten } from "../..";
import type { AccountAddressString } from "../../emojicoin_dot_fun/types";
import type { UserPositionWithInfo } from "../../indexer-v2/queries/api/user-position/types";
import { type AnyNumberString, isWriteSetChangeWriteResource } from "../../types";
import type { ArenaJsonTypes } from "../../types/arena-json-types";
import { toEscrowResource } from "../../types/arena-types";
import { toAccountAddressString } from "../account-address";
import { maxBigInt } from "../compare-bigint";
import { STRUCT_STRINGS } from "../type-tags";
import { toArenaCoinTypes } from "./helpers";

const isEscrowStruct = ({ value }: TypeTagStruct) => {
  const { address, moduleName, name } = value;
  const structString = [address.toString(), moduleName.identifier, name.identifier].join("::");
  return STRUCT_STRINGS["Escrow"] === structString;
};

/**
 * Any user escrow— including historical ones.
 */
export type UserEscrow = {
  version: bigint;
  user: `0x${string}`;
  meleeID: bigint;
  open: boolean;
  emojicoin0: bigint;
  emojicoin1: bigint;
  matchAmount: bigint;
  lockedIn: boolean;
  coinTypes: [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct];
};

export type HistoricalEscrow = Flatten<
  Omit<UserEscrow, "matchAmount" | "lockedIn"> & { matchAmount?: bigint; lockedIn?: bigint }
>;

export const isUserEscrow = (v: UserEscrow | HistoricalEscrow): v is UserEscrow =>
  v.matchAmount !== undefined && v.lockedIn !== undefined;

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
    const { meleeID, emojicoin0, emojicoin1, matchAmount } = toEscrowResource(resource);
    const typeTag = parseTypeTag(type);
    if (typeTag.isStruct() && isEscrowStruct(typeTag)) {
      const innerTags = typeTag.value.typeArgs;
      if (innerTags.every((v) => v.isStruct()) && innerTags.length === 4) {
        return {
          meleeID,
          open: !!(emojicoin0 || emojicoin1),
          emojicoin0,
          emojicoin1,
          matchAmount,
          lockedIn: matchAmount > 0n,
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

type ArenaCoinTypeStructs = [TypeTagStruct, TypeTagStruct, TypeTagStruct, TypeTagStruct];

// Convert a user's current and historical positions to `UserEscrow` types.
export const positionToUserEscrow = (
  pos: UserPositionWithInfo | ArenaLeaderboardHistoryWithArenaInfoModel
): UserEscrow | HistoricalEscrow => {
  const { user, meleeID, emojicoin0Balance: emojicoin0, emojicoin1Balance: emojicoin1 } = pos;

  const coinTypes = toArenaCoinTypes({
    symbol0: pos.emojicoin0Symbols,
    symbol1: pos.emojicoin1Symbols,
  }).filter((t) => t.isStruct()) as ArenaCoinTypeStructs;

  const sharedArgs = { user, meleeID, emojicoin0, emojicoin1, coinTypes };

  return "open" in pos
    ? {
        ...sharedArgs,
        version: pos.version,
        open: pos.open,
        matchAmount: pos.matchAmount,
        lockedIn: pos.matchAmount > 0n,
      }
    : {
        ...sharedArgs,
        version: maxBigInt(
          pos.arenaInfoLastTransactionVersion,
          pos.leaderboardHistoryLastTransactionVersion
        ),
        open: !pos.exited,
        matchAmount: undefined,
        lockedIn: undefined,
      };
};
