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

/**
 * In case a field doesn't match up with its proper parsing function, fall back to parsing it with
 * a primitive JSON parse.
 */
const tryWithFallbackParse = (parser: (v: any) => any) => (v: any) => {
  try {
    // Try the passed in parsing function.
    return parser(v);
  } catch {
    // Otherwise, as a last resort, stringify and re-parse the JSON data and then return the value
    // after parsing it, with no assumptions about what the parsing function should be and what data
    // type it should return.
    const fieldName = "substitute_json_field_name";
    const stringified = JSON_BIGINT.stringify({
      [fieldName]: v,
    });
    const parsed = JSON_BIGINT.parse(stringified);
    return parsed[fieldName];
  }
};
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
    try {
      const fn = converter.get(key as AnyColumnName) ?? parseDefault;
      // Curry the retrieved parsing function to add a fallback parsing function.
      const fnWithFallback = tryWithFallbackParse(fn);
      return fnWithFallback(value);
    } catch {
      console.error(`Failed to parse ${key}: ${value} as a ${converter.get(key as AnyColumnName)}`);
    }
  });
};

export const stringifyJSONWithBigInts = (msg: any): string => JSON_BIGINT.stringify(msg);
