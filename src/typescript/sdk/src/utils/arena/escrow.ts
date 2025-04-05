import {
  type MoveResource,
  parseTypeTag,
  type TypeTagStruct,
  type UserTransactionResponse,
  type WriteSetChangeWriteResource,
} from "@aptos-labs/ts-sdk";

import type {
  ArenaInfoModel,
  ArenaLeaderboardHistoryWithArenaInfoModel,
  ArenaPositionModel,
} from "../..";
import type { AccountAddressString } from "../../emojicoin_dot_fun/types";
import { type AnyNumberString, isWriteSetChangeWriteResource } from "../../types";
import type { ArenaJsonTypes } from "../../types/arena-json-types";
import { toEscrowResource } from "../../types/arena-types";
import { toAccountAddressString } from "../account-address";
import { maxBigInt } from "../compare-bigint";
import { toCoinTypeString } from "../parse-changes-for-balances";
import { type CoinTypeString, STRUCT_STRINGS } from "../type-tags";
import { toArenaCoinTypes } from "./helpers";

const isEscrowStruct = ({ value }: TypeTagStruct) => {
  const { address, moduleName, name } = value;
  const structString = [address.toString(), moduleName.identifier, name.identifier].join("::");
  return STRUCT_STRINGS["Escrow"] === structString;
};

/**
 * NOTE: The `matchAmount` for historical positions queried from the indexer are populated with
 * -1n to indicate they're invalid. They're not used in the app so it's fine- but it's good to
 * note here in case of any future confusion.
 */
const SUBSTITUTE_MATCH_AMOUNT_FOR_HISTORICAL = -1n;

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
    const { meleeID, emojicoin0, emojicoin1, matchAmount } = toEscrowResource(resource);
    const typeTag = parseTypeTag(type);
    if (typeTag.isStruct() && isEscrowStruct(typeTag)) {
      const innerTags = typeTag.value.typeArgs;
      if (innerTags.every((v) => v.isStruct()) && innerTags.length === 4) {
        return {
          meleeID,
          open: emojicoin0 !== 0n && emojicoin1 !== 0n,
          emojicoin0,
          emojicoin1,
          matchAmount,
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
      }
    : {
        ...sharedArgs,
        version: maxBigInt(
          pos.arenaInfoLastTransactionVersion,
          pos.leaderboardHistoryLastTransactionVersion
        ),
        open: !pos.exited,
        matchAmount: SUBSTITUTE_MATCH_AMOUNT_FOR_HISTORICAL,
      };
};

export type UserEscrowJson = {
  version: string;
  user: `0x${string}`;
  meleeID: string;
  open: boolean;
  emojicoin0: string;
  emojicoin1: string;
  matchAmount: string;
  coinTypes: [CoinTypeString, CoinTypeString, CoinTypeString, CoinTypeString];
};

export function toUserEscrowJson({
  version,
  user,
  meleeID,
  open,
  emojicoin0,
  emojicoin1,
  matchAmount,
  coinTypes,
}: UserEscrow): UserEscrowJson {
  return {
    version: version.toString(),
    user: user.toString() as `0x${string}`,
    meleeID: meleeID.toString(),
    open,
    emojicoin0: emojicoin0.toString(),
    emojicoin1: emojicoin1.toString(),
    matchAmount: (matchAmount ?? SUBSTITUTE_MATCH_AMOUNT_FOR_HISTORICAL).toString(),
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
  open,
  emojicoin0,
  emojicoin1,
  matchAmount,
  coinTypes,
}: UserEscrowJson): UserEscrow {
  return {
    version: BigInt(version),
    user,
    meleeID: BigInt(meleeID),
    open,
    emojicoin0: BigInt(emojicoin0),
    emojicoin1: BigInt(emojicoin1),
    matchAmount: BigInt(matchAmount ?? SUBSTITUTE_MATCH_AMOUNT_FOR_HISTORICAL),
    coinTypes: coinTypes.map((s) => parseTypeTag(s)).filter((t) => t.isStruct()) as [
      TypeTagStruct,
      TypeTagStruct,
      TypeTagStruct,
      TypeTagStruct,
    ],
  };
}
