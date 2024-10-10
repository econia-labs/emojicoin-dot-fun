import { type HexInput } from "@aptos-labs/ts-sdk";
import { normalizeHex } from "../utils/hex";
import AllSymbolEmojiJSON from "./symbol-emojis.json";
import {
  type EmojiName,
  type MarketSymbolEmojis,
  type SymbolEmoji,
  type SymbolEmojiData,
} from "./types";

const encoder = new TextEncoder();
const values: SymbolEmojiData[] = Object.entries(AllSymbolEmojiJSON).map(([emoji, name]) => {
  const bytes = encoder.encode(emoji);
  const hex = normalizeHex(bytes);
  return {
    name,
    hex,
    bytes,
    emoji: emoji as SymbolEmoji,
  };
});

const nameMap = new Map<string, SymbolEmojiData>(values.map((v) => [v.name, v]));
const hexMap = new Map<`0x${string}`, SymbolEmojiData>(values.map((v) => [v.hex, v]));
const emojiMap = new Map<string, SymbolEmojiData>(values.map((v) => [v.emoji, v]));

export const SYMBOL_DATA = {
  byStrictName: (v: EmojiName) => nameMap.get(v)!,
  byName: (v: string) => nameMap.get(v),
  byHex: (v: HexInput) => hexMap.get(normalizeHex(v)),
  byEmojiStrict: (v: SymbolEmoji) => emojiMap.get(v)!,
  byEmoji: (v: string) => emojiMap.get(v),
  hasName: (v: string): v is SymbolEmoji => nameMap.has(v),
  hasHex: (v: HexInput): v is SymbolEmoji => hexMap.has(normalizeHex(v)),
  hasEmoji: (v: string): v is SymbolEmoji => emojiMap.has(v),
};

export const getRandomEmoji = (): SymbolEmojiData => {
  const randomIndex = Math.floor(values.length * Math.random());
  return values[randomIndex];
};

/**
 * This function is used so often, it should be aliased for brevity.
 */
export const joinEmojis = (symbol: MarketSymbolEmojis) => symbol.join("");
