import {
  type AccountAddressInput,
  type TypeTag,
  AccountAddress,
  parseTypeTag,
  type TypeTagStruct,
} from "@aptos-labs/ts-sdk";
import { MODULE_ADDRESS, EMOJICOIN_DOT_FUN_MODULE_NAME } from "../const";

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

export const toEmojicoinStructString = (structName: string): string => {
  const res = toTypeTag(MODULE_ADDRESS, EMOJICOIN_DOT_FUN_MODULE_NAME, structName);
  if (!res.isStruct()) {
    throw new Error(`Unexpected non-struct type tag: ${res}`);
  }
  return res.toString();
};

export const toEmojicoinStructTag = (structName: string): TypeTagStruct => {
  const res = toTypeTag(MODULE_ADDRESS, EMOJICOIN_DOT_FUN_MODULE_NAME, structName);
  if (!res.isStruct()) {
    throw new Error(`Unexpected non-struct type tag: ${res}`);
  }
  return res;
};

export const TYPE_TAGS = {
  SwapEvent: toEmojicoinStructTag("Swap"),
  ChatEvent: toEmojicoinStructTag("Chat"),
  MarketRegistrationEvent: toEmojicoinStructTag("MarketRegistration"),
  PeriodicStateEvent: toEmojicoinStructTag("PeriodicState"),
  StateEvent: toEmojicoinStructTag("State"),
  GlobalStateEvent: toEmojicoinStructTag("GlobalState"),
  LiquidityEvent: toEmojicoinStructTag("Liquidity"),
} as const;

export const STRUCT_STRINGS = {
  SwapEvent: TYPE_TAGS.SwapEvent.toString(),
  ChatEvent: TYPE_TAGS.ChatEvent.toString(),
  MarketRegistrationEvent: TYPE_TAGS.MarketRegistrationEvent.toString(),
  PeriodicStateEvent: TYPE_TAGS.PeriodicStateEvent.toString(),
  StateEvent: TYPE_TAGS.StateEvent.toString(),
  GlobalStateEvent: TYPE_TAGS.GlobalStateEvent.toString(),
  LiquidityEvent: TYPE_TAGS.LiquidityEvent.toString(),
} as const;
