/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Bool,
  U8,
  U16,
  U32,
  U64,
  U128,
  U256,
  MoveString,
  AccountAddress,
  MoveOption,
  type EntryFunctionArgumentTypes,
  MoveVector,
} from "@aptos-labs/ts-sdk";
import { normalizeHex } from "../utils";

export type Primitive = boolean | number | string | bigint | undefined | null;
export type AnyPrimitive = Primitive | Array<AnyPrimitive> | Uint8Array;

type EntryFunctionOptionArg = MoveOption<
  Bool | U8 | U16 | U32 | U64 | U128 | U256 | MoveString | AccountAddress
>;

const isSingleValue = (
  v: any
): v is Bool | U8 | U16 | U32 | U64 | U128 | U256 | MoveString | AccountAddress =>
  v instanceof Bool ||
  v instanceof U8 ||
  v instanceof U16 ||
  v instanceof U32 ||
  v instanceof U64 ||
  v instanceof U128 ||
  v instanceof U256 ||
  v instanceof MoveString ||
  v instanceof AccountAddress;

const serializeToJSON = (
  value: EntryFunctionArgumentTypes | EntryFunctionOptionArg
): AnyPrimitive => {
  if (value instanceof MoveVector) {
    return value.values.map((v) => serializeToJSON(v));
  }
  if (value instanceof MoveOption) {
    const inner = value.value;
    if (typeof inner === "undefined") {
      return [];
    }
    return [serializeToJSON(inner)];
  }
  // A single serializable value.
  if (isSingleValue(value)) {
    if (value instanceof AccountAddress) {
      return value.toString();
    }
    return typeof value.value === "bigint" ? value.value.toString() : value.value;
  }
  // Fixed bytes. Treat them like a normal Move vector, although this may be incorrect.
  return normalizeHex(value.value);
};

export const serializeArgsToJSON = (
  args: Record<string, EntryFunctionArgumentTypes | EntryFunctionOptionArg>
) => Object.values(args).map((v) => serializeToJSON(v));

export default serializeArgsToJSON;
