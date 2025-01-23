import { type HexInput } from "@aptos-labs/ts-sdk";
import emojiRegex from "emoji-regex";
import { normalizeHex } from "../utils/hex";
import { CHAT_EMOJI_DATA, getRandomSymbolEmoji, SYMBOL_EMOJI_DATA } from "./emoji-data";
import {
  type SymbolEmojiData,
  type SymbolEmojiName,
  type SymbolData,
  type SymbolEmoji,
  type AnyEmoji,
  type AnyEmojiData,
} from "./types";
import { MAX_SYMBOL_LENGTH } from "../const";

export const getEmojisInString = (symbols: string): Array<AnyEmoji> => {
  const regex = emojiRegex();
  const matches = symbols.matchAll(regex);
  return Array.from(matches).map((match) => match[0]) as Array<AnyEmoji>;
};

export const getSymbolEmojisInString = (symbols: string): SymbolEmoji[] => {
  return getEmojisInString(symbols).filter(SYMBOL_EMOJI_DATA.hasEmoji);
};

/**
 *
 * A function that returns an emoji's data from any string input that could represent a single
 * emoji, be its name or native emoji character.
 *
 * @param input any emoji or emoji name
 * @returns the emoji data for that emoji or undefined
 *
 */
export const getEmojiData = (input: string = ""): AnyEmojiData | undefined =>
  input
    ? (SYMBOL_EMOJI_DATA.byEmoji(input) ??
      CHAT_EMOJI_DATA.byEmoji(input) ??
      SYMBOL_EMOJI_DATA.byName(input) ??
      CHAT_EMOJI_DATA.byName(input))
    : undefined;

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
export const isValidEmoji = (emoji: string): boolean => SYMBOL_EMOJI_DATA.hasEmoji(emoji);

/**
 * Parses a string passed in and maps each individual emoji to its corresponding data.
 * If none of the emojis are valid, no error is thrown, the array is just empty.
 * Note that this ignores invalid emojis.
 * @param symbolInput the symbol to be parsed or an array of emojis to be joined into one symbol.
 * @returns an object containing the array of emoji data and the final concatenated symbol.
 */
export const symbolToEmojis = (symbolInput: string | string[]) => {
  const symbol = Array.isArray(symbolInput) ? symbolInput.join("") : symbolInput;
  const emojis = getEmojisInString(symbol)
    .map((emoji) => getEmojiData(emoji))
    .filter((data) => data !== undefined);
  return {
    emojis: emojis as Array<SymbolEmojiData>,
    symbol,
  };
};

export const symbolBytesToEmojis = (symbol: string | Uint8Array | Uint8Array[]) => {
  if (symbol.length === 0) return { emojis: [], symbol: "" };
  if (symbol instanceof Uint8Array) {
    const symbolString = new TextDecoder().decode(symbol);
    return symbolToEmojis(symbolString);
  }
  if (Array.isArray(symbol)) {
    const flattened = symbol.flatMap((x) => Array.from(x.values()));
    const symbolString = new TextDecoder().decode(new Uint8Array(flattened));
    return symbolToEmojis(symbolString);
  }
  try {
    // Try to parse the string as hex.
    const hex = symbol.startsWith("0x") ? symbol.slice(2) : symbol;
    const bytes = Buffer.from(hex, "hex");
    const symbolString = new TextDecoder().decode(bytes);
    if (!symbolString) throw new Error("Empty or not a hex string. Try parsing as an emoji now.");
    return symbolToEmojis(symbolString);
  } catch (e) {
    const emojis = getEmojisInString(symbol);
    return {
      emojis: emojis
        .map((emoji) => getEmojiData(emoji))
        .filter((data) => typeof data !== "undefined")
        .map((data) => data as SymbolEmojiData), // Explicit cast because we know it's defined.
      symbol,
    };
  }
};

/**
 * Utility function to join the emojis by name, given a list of SymbolEmojiData objects.
 * @param emojis
 * @param delimiter
 * @returns a string of the emoji names joined by the delimiter.
 */
export const joinEmojiNames = (emojis: Array<SymbolEmojiData>, delimiter: string = ","): string =>
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
    SYMBOL_EMOJI_DATA.hasHex(normalizeHex(input));
    return true;
  } catch (e) {
    return false;
  }
};

export const encodeText = (s: string) => new TextEncoder().encode(s);
export const encodeToHexString = (s: string) => Buffer.from(encodeText(s)).toString("hex");

export const isStringArray = (arr: Array<unknown>): arr is Array<string> =>
  Array.isArray(arr) && arr.every((val) => typeof val === "string");

export const encodeSymbolData = (data: SymbolEmojiData[]) =>
  Buffer.from(data.flatMap((v) => Array.from(v.bytes))).toString("hex");

export const encodeEmojis = (emojis: string[] | SymbolEmojiData[]) =>
  `0x${
    isStringArray(emojis) ? encodeToHexString(emojis.join("")) : encodeSymbolData(emojis)
  }` as `0x${string}`;

/**
 * A helper/wrapper function for `symbolBytesToEmojis` that returns all emoji and symbol data.
 * Note that `emojis` is the data for each individual emoji, while `symbolData` is the final
 * concatenated symbol data.
 */
export type MarketEmojiData = {
  emojis: SymbolEmojiData[];
  symbolData: SymbolData;
};

/**
 * A helper/wrapper function for `symbolBytesToEmojis` that returns all emoji and symbol data.
 * @param symbolInput
 * @returns an object containing the array of emoji data and the final concatenated symbol data.
 */
export const toMarketEmojiData = (
  symbolInput: string | Uint8Array | Uint8Array[]
): MarketEmojiData => {
  const { emojis, symbol } = symbolBytesToEmojis(symbolInput);
  const symbolData: SymbolData = {
    symbol,
    name: joinEmojiNames(emojis),
    hex: encodeEmojis(emojis),
    bytes: new Uint8Array(emojis.flatMap((v) => Array.from(v.bytes))),
  };
  return {
    emojis,
    symbolData,
  };
};

export const generateRandomSymbol = () => {
  const emojis: SymbolEmojiData[] = [];
  let i = 0;
  const sumBytes = (bytes: Uint8Array[]) => bytes.reduce((acc, b) => acc + b.length, 0);
  // Try 1000 times to add another emoji to the symbol.
  // Thus, it is guaranteed to return at least one emoji, but there may be multiple in the symbol.
  while (i < 1000) {
    const randomEmoji = getRandomSymbolEmoji();
    if (sumBytes([...emojis.map((e) => e.bytes), randomEmoji.bytes]) < MAX_SYMBOL_LENGTH) {
      emojis.push(randomEmoji);
    }
    i += 1;
  }

  const symbolBytes = new Uint8Array(emojis.flatMap((e) => Array.from(e.bytes)));
  return toMarketEmojiData(symbolBytes);
};

export const namesToEmojis = (...names: SymbolEmojiName[]) =>
  names.map((name) => SYMBOL_EMOJI_DATA.byStrictName(name).emoji);
