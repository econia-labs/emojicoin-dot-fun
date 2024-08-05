import { type HexInput } from "@aptos-labs/ts-sdk";
import { normalizeHex } from "../utils/hex";
import AllSymbolEmojiJSON from "./symbol-emojis.json";
import { type SymbolEmojiData } from "./types";
import { MAX_SYMBOL_LENGTH } from "../const";

const encoder = new TextEncoder();
const values: SymbolEmojiData[] = Object.entries(AllSymbolEmojiJSON).map(([name, emoji]) => {
  const bytes = encoder.encode(emoji);
  const hex = normalizeHex(bytes);
  return {
    name: name as keyof typeof AllSymbolEmojiJSON,
    hex,
    bytes,
    emoji,
  };
});

const nameMap = new Map<string, SymbolEmojiData>(values.map((v) => [v.name, v]));
const hexMap = new Map<`0x${string}`, SymbolEmojiData>(values.map((v) => [v.hex, v]));
const emojiMap = new Map<string, SymbolEmojiData>(values.map((v) => [v.emoji, v]));

export const SYMBOL_DATA = {
  byStrictName: (v: keyof typeof AllSymbolEmojiJSON) => nameMap.get(v)!,
  byName: (v: string) => nameMap.get(v),
  byHex: (v: HexInput) => hexMap.get(normalizeHex(v)),
  byEmoji: (v: string) => emojiMap.get(v),
  hasName: (v: string) => nameMap.has(v),
  hasHex: (v: HexInput) => hexMap.has(normalizeHex(v)),
  hasEmoji: (v: string) => emojiMap.has(v),
};

export const getRandomEmoji = (): SymbolEmojiData => {
  const randomIndex = Math.floor(values.length * Math.random());
  return values[randomIndex];
};

export const generateRandomSymbol = () => {
  const emojis: SymbolEmojiData[] = [];
  let i = 0;
  const sumBytes = (bytes: Uint8Array[]) => bytes.reduce((acc, b) => acc + b.length, 0);
  // Try 10 times. Guaranteed to return at least one emoji, but possibly multiple.
  while (i < 10) {
    const randomEmoji = getRandomEmoji();
    if (sumBytes([...emojis.map((e) => e.bytes), randomEmoji.bytes]) < MAX_SYMBOL_LENGTH) {
      emojis.push(randomEmoji);
    }
    i += 1;
  }
  return emojis;
};
