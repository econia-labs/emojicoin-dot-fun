import { type HexInput } from "@aptos-labs/ts-sdk";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

/**
 * Because `Hex.fromHexInput(hex).toString() as `0x${string}`` is too verbose and heavy.
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
