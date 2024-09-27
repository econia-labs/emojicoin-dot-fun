import parse from "json-bigint";

const JSON_BIGINT = parse({
  alwaysParseAsBig: true,
  useNativeBigInt: true,
  protoAction: "ignore",
  constructorAction: "ignore",
});

/**
 * Parses a JSON string that uses bigints- i.e., numbers too large for a normal number, but not used
 * as strings. Without this parsing method, the parsed value loses precision.
 *
 * With this method, we re-stringify the message and convert all bigint values to strings.
 *
 * If we have `alwaysParseAsBig` in the config options set to `true`, then all numbers are converted
 * to bigints and thus all numeric values are converted to strings in the re-stringified output.
 */
export const stringifyParsedBigInts = (msg: string) =>
  JSON.stringify(JSON_BIGINT.parse(msg), (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );

/**
 * Casts a stringified, safely-parsed bigint JSON response into the generic type T.
 */
export const parseJSONWithBigInts = <T extends any>(msg: string): T =>
  JSON.parse(stringifyParsedBigInts(msg)) as T;
