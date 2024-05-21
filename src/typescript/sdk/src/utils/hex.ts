import { Hex, type HexInput } from "@aptos-labs/ts-sdk";

/**
 * Because `Hex.fromHexInput(hex).toString() as `0x${string}`` is too verbose.
 * @param hex
 * @returns a normalized hex string as `0x${string}`
 */
export const normalizeHex = (hex: HexInput) => Hex.fromHexInput(hex).toString() as `0x${string}`;

const VALID_HEX_CHARS = new Set("0123456789abcdef");

export const isHexInput = (input: string | Uint8Array): input is HexInput => {
  if (typeof input === "string") {
    const hex = input.toLowerCase().startsWith("0x") ? input.slice(2) : input;
    const chars = new Set(hex);
    return Array.from(chars).every((c) => VALID_HEX_CHARS.has(c));
  }
  return true;
};
