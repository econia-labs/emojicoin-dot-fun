/* eslint-disable @typescript-eslint/no-explicit-any */
import Big from "big.js";
import parse from "json-bigint";
import { bigintColumns, floatColumns, integerColumns } from "./types/postgres-numeric-types";
import { type AnyColumnName } from "./types/json-types";

const JSON_BIGINT = parse({
  alwaysParseAsBig: false,
  useNativeBigInt: true,
  storeAsString: true,
  protoAction: "ignore",
  constructorAction: "ignore",
});

const parseFloat = (v: any) => Big(v).toString();
const parseBigInt = (v: any) => BigInt(v);
const parseInteger = (v: any) => Number(v);
const parseDefault = (v: any) => v;
const floatConversions = [...Array.from(floatColumns).map((c) => [c, parseFloat] as const)];
const bigintConversions = [...Array.from(bigintColumns).map((c) => [c, parseBigInt] as const)];
const integerConversions = [...Array.from(integerColumns).map((c) => [c, parseInteger] as const)];

const converter = new Map<AnyColumnName, (value: any) => any>([
  ...floatConversions,
  ...bigintConversions,
  ...integerConversions,
]);

/**
 * Parses a JSON string that uses bigints- i.e., numbers too large for a normal number, but not used
 * as strings. Without this parsing method, the parsed value loses precision or results in an error.
 *
 * Eventually, this could be more fully fleshed out to utilize more precise deserialization.
 */
export const parseJSONWithBigInts = <T>(msg: string): T => {
  return JSON_BIGINT.parse(msg, (key, value) => {
    const fn = converter.get(key as AnyColumnName) ?? parseDefault;
    return fn(value);
  });
};

export const stringifyJSONWithBigInts = (msg: any): string => JSON_BIGINT.stringify(msg);
