import { normalizeHex } from "../utils";
import AllSymbolEmojiJSON from "./symbol-emojis.json";
import { SymbolEmojiData } from "./types";

const encoder = new TextEncoder();

export const getRandomEmoji = (): SymbolEmojiData => {
  const randomIndex = Math.floor(values.length * Math.random());
  return values[randomIndex];
};

const values: SymbolEmojiData[] = Object.entries(AllSymbolEmojiJSON).map(([name, emoji]) => {
  const bytes = encoder.encode(emoji);
  const hex = normalizeHex(bytes);
  return {
    name,
    hex,
    bytes,
    emoji,
  };
});

const nameMap = new Map<string, SymbolEmojiData>(values.map((v) => [v.name, v]));
const hexMap = new Map<`0x${string}`, SymbolEmojiData>(values.map((v) => [v.hex, v]));
const emojiMap = new Map<string, SymbolEmojiData>(values.map((v) => [v.emoji, v]));

export const SYMBOL_DATA = {
  byName: (v: string) => nameMap.get(v),
  byHex: (v: `0x${string}`) => hexMap.get(v),
  byEmoji: (v: string) => emojiMap.get(v),
  hasName: (v: string) => nameMap.has(v),
  hasHex: (v: `0x${string}`) => hexMap.has(v),
  hasEmoji: (v: string) => emojiMap.has(v),
};
