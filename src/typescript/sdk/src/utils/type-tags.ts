import {
  type AccountAddressInput,
  AccountAddress,
  parseTypeTag,
  type TypeTag,
  type TypeTagStruct,
} from "@aptos-labs/ts-sdk";
import {
  MODULE_ADDRESS,
  EMOJICOIN_DOT_FUN_MODULE_NAME,
  REWARDS_MODULE_NAME,
  REWARDS_MODULE_ADDRESS,
} from "../const";
import { type TypeTagInput } from "../emojicoin_dot_fun";

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

export type StructTagString = `0x${string}::${string}::${string}`;

export const TYPE_TAGS: { [K in EmojicoinStructName]: TypeTag } = {
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
};

export const STRUCT_STRINGS: { [K in EmojicoinStructName]: StructTagString } = {
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
};

const structStringToName = new Map(
  Array.from(new Map(Object.entries(STRUCT_STRINGS)).entries()).map(([key, value]) => {
    return [value, key as EmojicoinStructName] as const;
  })
);

export const typeTagInputToStructName = (typeTag: TypeTagInput): EmojicoinStructName | undefined =>
  structStringToName.get(typeTag.toString() as StructTagString);
