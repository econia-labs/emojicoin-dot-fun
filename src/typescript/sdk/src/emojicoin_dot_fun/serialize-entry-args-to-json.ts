/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AccountAddress,
  MoveOption,
  MoveVector,
  FixedBytes,
  type EntryFunctionArgumentTypes,
} from "@aptos-labs/ts-sdk";

export type Primitive = boolean | number | string | bigint | undefined | null;
export type AnyPrimitive = Primitive | Array<AnyPrimitive>;

// For general-purpose serialization of entry function arguments to JSON-serializable values.
export const serializeEntryArgsToJson = (
  value: EntryFunctionArgumentTypes
): AnyPrimitive => {
  if (value instanceof MoveVector) {
    return value.values.map((v) => serializeEntryArgsToJson(v));
  }
  if (value instanceof MoveOption) {
    const inner = value.value;
    if (typeof inner === "undefined") {
      return [];
    }
    return [serializeEntryArgsToJson(inner)];
  }
  // This may not be properly handled, but it should generally never be used for JSON-serializable
  // purposes anyway. Return the hex bytes of FixedBytes if it appears.
  if (value instanceof FixedBytes) {
    return value.bcsToHex().toString();
  }
  if (value instanceof AccountAddress) {
    return value.toString();
  }
  return typeof value.value === "bigint" ? value.value.toString() : value.value;
};

// For the wallet adapter payload.
export const serializeEntryArgsToJsonArray = (
  args: Record<string, EntryFunctionArgumentTypes>
) => Object.values(args).map((v) => serializeEntryArgsToJson(v));

export default serializeEntryArgsToJsonArray;
