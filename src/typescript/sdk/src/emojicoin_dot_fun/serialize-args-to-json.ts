import {
  type SimpleEntryFunctionArgumentTypes,
  MoveVector,
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
} from "@aptos-labs/ts-sdk";

// TODO: Clean this up later and make it more composable.
const serializeArgsToJSON = (args: any): Array<SimpleEntryFunctionArgumentTypes> => {
  const res = Object.keys(args).map((key) => {
    const value = args[key as keyof typeof args];
    if (value instanceof MoveVector) {
      if (value.values[0] instanceof MoveVector) {
        return value.values.flatMap((v) => serializeArgsToJSON(v));
      }
      if (
        value.values[0] instanceof Bool ||
        value.values[0] instanceof U8 ||
        value.values[0] instanceof U16 ||
        value.values[0] instanceof U32 ||
        value.values[0] instanceof U64 ||
        value.values[0] instanceof U128 ||
        value.values[0] instanceof U256 ||
        value.values[0] instanceof MoveString
      ) {
        return value.values.map((v) =>
          typeof v.value === "bigint" ? v.value.toString() : v.value
        );
      }
      return value.values.map((v: any) => serializeArgsToJSON(v));
    }
    if (Array.isArray(value)) {
      if (value[0] instanceof MoveVector) {
        return value.flatMap((v) => serializeArgsToJSON(v));
      }
      if (
        value[0] instanceof Bool ||
        value[0] instanceof U8 ||
        value[0] instanceof U16 ||
        value[0] instanceof U32 ||
        value[0] instanceof U64 ||
        value[0] instanceof U128 ||
        value[0] instanceof U256 ||
        value[0] instanceof MoveString
      ) {
        return value.map((v) => (typeof v.value === "bigint" ? v.value.toString() : v.value));
      }
      return value.map((v: any) => serializeArgsToJSON(v));
    }
    if (value instanceof AccountAddress) {
      return value.toString();
    }
    if (value instanceof Uint8Array) {
      return `0x${Buffer.from(value).toString("hex")}`;
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (value instanceof MoveOption) {
      return value.value ? serializeArgsToJSON(value.value) : null;
    }
    if (
      value instanceof Bool ||
      value instanceof U8 ||
      value instanceof U16 ||
      value instanceof U32 ||
      value instanceof U64 ||
      value instanceof U128 ||
      value instanceof U256 ||
      value instanceof MoveString
    ) {
      return typeof value.value === "bigint" ? value.value.toString() : value.value;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    throw new Error(`Unsupported type ${typeof value} => ${value}`);
  });
  return res;
};

export default serializeArgsToJSON;
