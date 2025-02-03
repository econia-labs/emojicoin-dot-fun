/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AccountAddress,
  MoveOption,
  MoveVector,
  FixedBytes,
  type EntryFunctionArgumentTypes,
} from "@aptos-labs/ts-sdk";

export type Primitive = boolean | number | string | bigint | undefined | null;
export type AnyPrimitive = Primitive | Array<AnyPrimitive> | Uint8Array;

const serializeToJSON = (value: EntryFunctionArgumentTypes): AnyPrimitive => {
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

export const serializeArgsToJSON = (args: Record<string, EntryFunctionArgumentTypes>) =>
  Object.values(args).map((v) => serializeToJSON(v));

export default serializeArgsToJSON;
