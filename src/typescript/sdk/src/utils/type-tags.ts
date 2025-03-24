import {
  AccountAddress,
  type AccountAddressInput,
  parseTypeTag,
  type TypeTag,
  type TypeTagStruct,
} from "@aptos-labs/ts-sdk";

import {
  ARENA_MODULE_ADDRESS,
  ARENA_MODULE_NAME,
  EMOJICOIN_DOT_FUN_MODULE_NAME,
  MODULE_ADDRESS,
  REWARDS_MODULE_ADDRESS,
  REWARDS_MODULE_NAME,
} from "../const";
import type { TypeTagInput } from "../emojicoin_dot_fun";
import { removeLeadingZeros } from "./account-address";

export function toTypeTag(
  addressInput: AccountAddressInput,
  moduleName: string,
  structName: string
): TypeTag {
  const address = AccountAddress.from(addressInput);
  return parseTypeTag(`${address.toString()}::${moduleName}::${structName}`);
}

export function toTypeTagString(
  addressInput: AccountAddressInput,
  moduleName: string,
  structName: string
): string {
  return toTypeTag(addressInput, moduleName, structName).toString();
}

export const toEmojicoinStructTag = (structName: string): TypeTagStruct => {
  const res = toTypeTag(MODULE_ADDRESS, EMOJICOIN_DOT_FUN_MODULE_NAME, structName);
  if (!res.isStruct()) {
    throw new Error(`Unexpected non-struct type tag: ${res}`);
  }
  return res;
};

export const toEmojicoinRewardsStructTag = (structName: string): TypeTagStruct => {
  const res = toTypeTag(REWARDS_MODULE_ADDRESS, REWARDS_MODULE_NAME, structName);
  if (!res.isStruct()) {
    throw new Error(`Unexpected non-struct type tag: ${res}`);
  }
  return res;
};

export const toArenaStructTag = (structName: string): TypeTagStruct => {
  const res = toTypeTag(ARENA_MODULE_ADDRESS, ARENA_MODULE_NAME, structName);
  if (!res.isStruct()) {
    throw new Error(`Unexpected non-struct type tag: ${res}`);
  }
  return res;
};

export type EmojicoinStructName =
  | "SwapEvent"
  | "ChatEvent"
  | "MarketRegistrationEvent"
  | "PeriodicStateEvent"
  | "StateEvent"
  | "GlobalStateEvent"
  | "LiquidityEvent"
  | "Market"
  | "Registry"
  | "RegistrantGracePeriodFlag"
  | "EmojicoinDotFunRewards";

export type ArenaStructName =
  | "ArenaMeleeEvent"
  | "ArenaEnterEvent"
  | "ArenaExitEvent"
  | "ArenaSwapEvent"
  | "ArenaVaultBalanceUpdateEvent";

export type StructTagString = `0x${string}::${string}::${string}`;

type AnyEmojicoinDotFunStructName = EmojicoinStructName | ArenaStructName;

export const TYPE_TAGS: { [K in AnyEmojicoinDotFunStructName]: TypeTag } = {
  SwapEvent: toEmojicoinStructTag("Swap"),
  ChatEvent: toEmojicoinStructTag("Chat"),
  MarketRegistrationEvent: toEmojicoinStructTag("MarketRegistration"),
  PeriodicStateEvent: toEmojicoinStructTag("PeriodicState"),
  StateEvent: toEmojicoinStructTag("State"),
  GlobalStateEvent: toEmojicoinStructTag("GlobalState"),
  LiquidityEvent: toEmojicoinStructTag("Liquidity"),
  Market: toEmojicoinStructTag("Market"),
  Registry: toEmojicoinStructTag("Registry"),
  RegistrantGracePeriodFlag: toEmojicoinStructTag("RegistrantGracePeriodFlag"),
  EmojicoinDotFunRewards: toEmojicoinRewardsStructTag("EmojicoinDotFunRewards"),
  ArenaMeleeEvent: toArenaStructTag("Melee"),
  ArenaEnterEvent: toArenaStructTag("Enter"),
  ArenaExitEvent: toArenaStructTag("Exit"),
  ArenaSwapEvent: toArenaStructTag("Swap"),
  ArenaVaultBalanceUpdateEvent: toArenaStructTag("VaultBalanceUpdate"),
};

export const STRUCT_STRINGS: { [K in AnyEmojicoinDotFunStructName]: StructTagString } = {
  SwapEvent: TYPE_TAGS.SwapEvent.toString() as StructTagString,
  ChatEvent: TYPE_TAGS.ChatEvent.toString() as StructTagString,
  MarketRegistrationEvent: TYPE_TAGS.MarketRegistrationEvent.toString() as StructTagString,
  PeriodicStateEvent: TYPE_TAGS.PeriodicStateEvent.toString() as StructTagString,
  StateEvent: TYPE_TAGS.StateEvent.toString() as StructTagString,
  GlobalStateEvent: TYPE_TAGS.GlobalStateEvent.toString() as StructTagString,
  LiquidityEvent: TYPE_TAGS.LiquidityEvent.toString() as StructTagString,
  Market: TYPE_TAGS.Market.toString() as StructTagString,
  Registry: TYPE_TAGS.Registry.toString() as StructTagString,
  RegistrantGracePeriodFlag: TYPE_TAGS.RegistrantGracePeriodFlag.toString() as StructTagString,
  EmojicoinDotFunRewards: TYPE_TAGS.EmojicoinDotFunRewards.toString() as StructTagString,
  ArenaMeleeEvent: TYPE_TAGS.ArenaMeleeEvent.toString() as StructTagString,
  ArenaEnterEvent: TYPE_TAGS.ArenaEnterEvent.toString() as StructTagString,
  ArenaExitEvent: TYPE_TAGS.ArenaExitEvent.toString() as StructTagString,
  ArenaSwapEvent: TYPE_TAGS.ArenaSwapEvent.toString() as StructTagString,
  ArenaVaultBalanceUpdateEvent:
    TYPE_TAGS.ArenaVaultBalanceUpdateEvent.toString() as StructTagString,
};

const structStringToName = new Map(
  Array.from(new Map(Object.entries(STRUCT_STRINGS)).entries()).map(([key, value]) => {
    return [value, key as AnyEmojicoinDotFunStructName] as const;
  })
);

export const typeTagInputToStructName = (
  typeTag: TypeTagInput
): AnyEmojicoinDotFunStructName | undefined =>
  structStringToName.get(typeTag.toString() as StructTagString);

/**
 * Primarily for the `GraphQL` indexer, since it expects fungible asset/coin types to not have
 * leading zeros at the beginning of the struct type tag.
 *
 * @param assetType a type tag string that matches the form `0x${string}::${string}::${string}
 * @throws if `assetType` cannot be converted to a TypeTagStruct type
 * @returns a coin type tag with no leading zeros
 */
export const removeLeadingZerosFromStructString = (
  assetType: `0x${string}::${string}::${string}` | ReturnType<TypeTagStruct["toString"]>
) => {
  const typeTag = parseTypeTag(assetType);
  if (!typeTag.isStruct()) {
    throw new Error("Invalid coin type tag.");
  }

  const { address, moduleName, name } = typeTag.value;
  const shortenedAddress = removeLeadingZeros(address.toString());

  return `${shortenedAddress}::${moduleName.identifier}::${name.identifier}`;
};
