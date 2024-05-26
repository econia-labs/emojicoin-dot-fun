import { type HexInput } from "@aptos-labs/ts-sdk";
import { normalizeHex } from "../utils/hex";
import { SYMBOL_DATA } from "./symbol-data";
import { type SymbolEmojiData, type EmojiName } from "./types";

/**
 *
 * A function that returns an emoji's data from any input that could represent a single
 * emoji, be its hex string, name, emoji character, or Uint8Array bytes.
 *
 * @param input any input that could represent an emoji
 * @returns SymbolEmoji if the input is a valid emoji, otherwise undefined.
 *
 */
export const getEmojiData = (input: HexInput | EmojiName): SymbolEmojiData | undefined => {
  if (typeof input === "string") {
    if (SYMBOL_DATA.hasEmoji(input)) {
      return SYMBOL_DATA.byEmoji(input);
    }
    if (SYMBOL_DATA.hasName(input)) {
      return SYMBOL_DATA.byName(input);
    }
    if (input.startsWith("0x")) {
      return SYMBOL_DATA.byHex(input as `0x${string}`);
    }
    return SYMBOL_DATA.byHex(`0x${input}`);
  }
  const hex = normalizeHex(input);
  return SYMBOL_DATA.byHex(hex);
};

/**
 *
 * @param emoji An emoji to check if it is a valid symbol.
 * @returns whether or not the symbol is a valid emoji.
 *
 * @example
 * ```typescript
 * isValidSymbol('🟥'); // true
 * ```
 */
export const isValidEmoji = (emoji: string): boolean => SYMBOL_DATA.hasEmoji(emoji);

/**
 *
 * @param symbolHex A hex string or Uint8Array to check if the passed in hex string bytes are a
 * valid emoji symbol.
 * @returns whether or not the symbol is a valid emoji.
 *
 * @example
 * ```typescript
 * isValidSymbolHex('0xf09f9fa5'); // true
 * isValidSymbolHex(new Uint8Array([ 240, 159, 159, 165 ])); // true
 * ```
 */
export const isValidEmojiHex = (input: HexInput) => {
  try {
    SYMBOL_DATA.hasHex(normalizeHex(input));
    return true;
  } catch (e) {
    return false;
  }
};
