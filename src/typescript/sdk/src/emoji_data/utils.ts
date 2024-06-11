import { type HexInput } from "@aptos-labs/ts-sdk";
import emojiRegex from "emoji-regex";
import { normalizeHex } from "../utils/hex";
import { SYMBOL_DATA } from "./symbol-data";
import { type SymbolEmojiData, type EmojiName } from "./types";
import { MAX_SYMBOL_LENGTH } from "../const";

export const getEmojisInString = (symbols: string): Array<string> => {
  const regex = emojiRegex();
  const matches = symbols.matchAll(regex);
  return Array.from(matches).map((match) => match[0]);
};

/**
 *
 * A function that returns an emoji's data from any input that could represent a single
 * emoji, be its hex string, name, emoji character, or Uint8Array bytes.
 *
 * If you know the input type, consider using the more specific map {@link SYMBOL_DATA}.
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
    if (SYMBOL_DATA.hasHex(normalizeHex(input))) {
      return SYMBOL_DATA.byHex(`0x${input}`);
    }
    return undefined;
  }
  const hex = normalizeHex(input);
  return SYMBOL_DATA.byHex(hex);
};

/**
 *
 * @param emoji An emoji to check if it is a valid emoji.
 * @returns whether or not the emoji is a valid emoji.
 *
 * @example
 * ```typescript
 * isValidEmoji('🟥'); // true
 * ```
 */
export const isValidEmoji = (emoji: string): boolean => SYMBOL_DATA.hasEmoji(emoji);

/**
 * This parses an input string to see if it's a valid symbol.
 * It not only checks that each individual emoji is valid, but also that the total number
 * of bytes is valid as well.
 * @param symbol the symbol to be checked.
 * @returns whether or not the symbol is a valid symbol.
 *
 * @example
 * ```typescript
 * isValidSymbol('🟥🟥'); // true
 * isValidSymbol('🟥🟥🟥🟥🟥'); // false (too long)
 * ```
 */
export const isValidSymbol = (symbols: string): boolean => {
  const numBytes = new TextEncoder().encode(symbols).length;
  if (numBytes > MAX_SYMBOL_LENGTH || numBytes === 0) {
    return false;
  }
  const emojis = getEmojisInString(symbols);
  const reconstructed = Array.from(emojis).join("");
  if (reconstructed !== symbols) {
    return false;
  }
  for (const emoji of emojis) {
    if (!isValidEmoji(emoji)) {
      return false;
    }
  }
  return true;
};

/**
 * Parses a string passed in and maps each individual emoji to its corresponding data.
 * If none of the emojis are valid, no error is thrown, the array is just empty.
 * Note that this ignores invalid emojis.
 * @param symbol
 * @returns an array of SymbolEmojiData objects.
 */
export const symbolToEmojis = (symbol: string): Array<SymbolEmojiData> => {
  const emojis = getEmojisInString(symbol)
    .map((emoji) => getEmojiData(emoji))
    .filter((data) => data !== undefined);
  return emojis as Array<SymbolEmojiData>;
};

export const symbolBytesToEmojis = (symbol: `0x${string}`) => {
  const hex = symbol.startsWith("0x") ? symbol.slice(2) : symbol;
  const bytes = Buffer.from(hex, "hex");
  const symbolString = new TextDecoder().decode(bytes);
  return { emojis: symbolToEmojis(symbolString), symbol: symbolString };
};

/**
 * Utility function to join the emojis by name, given a list of SymbolEmojiData objects.
 * @param emojis
 * @param delimiter
 * @returns a string of the emoji names joined by the delimiter.
 */
export const joinEmojis = (emojis: Array<SymbolEmojiData>, delimiter: string = ", "): string =>
  emojis.map((e) => e.name).join(delimiter);

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
