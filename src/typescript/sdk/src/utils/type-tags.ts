import {
  type AccountAddressInput,
  type TypeTag,
  AccountAddress,
  parseTypeTag,
  type TypeTagStruct,
} from "@aptos-labs/ts-sdk";
import { MODULE_ADDRESS, EMOJICOIN_DOT_FUN_MODULE_NAME } from "../emojicoin_dot_fun/const";

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

export const toEmojicoinDotFunStructTag = (structName: string): TypeTagStruct => {
  const res = toTypeTag(MODULE_ADDRESS, EMOJICOIN_DOT_FUN_MODULE_NAME, structName);
  if (!res.isStruct()) {
    throw new Error(`Unexpected non-struct type tag: ${res}`);
  }
  return res;
};
