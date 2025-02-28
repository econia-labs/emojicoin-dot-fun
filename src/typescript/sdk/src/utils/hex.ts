import { type HexInput } from "@aptos-labs/ts-sdk";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

// -------------------------------------------------------------------------------------------------
//
// NOTE: If you try to import @aptos-labs/ts-sdk in this file, the frontend build will fail due to
// the usage of `setImmediate` which is unavailable to the `edge` runtime used in NextJS middleware.
//
// -------------------------------------------------------------------------------------------------

/**
 * A helper function to normalize a hex string without having to import @aptos-labs/ts-sdk.
 *
 * Does *not* require hex inputs to be prefixed with `0x`.
 *
 * This function will NOT throw an error if the resulting byte array is empty.
 * That is, `0x`, `[]`, and `` are valid inputs.
 *
 * @param hex
 * @returns a normalized hex string as `0x${string}`
 */
export const normalizeHex = (hex: HexInput) => {
  let bytes;
  if (typeof hex === "string") {
    if (hex.length % 2 !== 0) {
      throw new Error(`Invalid hex input: ${hex}, length is not a multiple of 2.`);
    }
    const data = hex.startsWith("0x") ? hex.slice(2) : hex;
    try {
      bytes = hexToBytes(data);
    } catch (e) {
      throw new Error(`Invalid hex input: ${hex}, failed to convert "${data}" to bytes.`);
    }
  } else {
    bytes = hex;
  }
  return `0x${bytesToHex(bytes)}` as const;
};

/**
 * Converts an input hex string or byte array to a hex string.
 *   - If received from postgrest, `BYTEA` bytes come in as a string in the format "\\xabcd" where
 *     "abcd" is the hex string.
 *   - If received from the rust broker, the bytes will be a number[] array.
 *
 * Also accepts valid hex `string`, `0x${string}` and `Uint8Array` inputs.
 *
 * @param bytes the input hex string, number array, or byte array
 * @returns a valid hex string: `0x${string}`
 */
export const deserializeToHexString = (
  bytes: `0x${string}` | `\\x${string}` | number[] | Uint8Array
): `0x${string}` => {
  if (typeof bytes === "string") {
    return `0x${bytes.replace(/^(0x|\\x)/, "")}`;
  }
  const uint8Arr = new Uint8Array([...bytes]);
  return `0x${bytesToHex(uint8Arr)}`;
};
