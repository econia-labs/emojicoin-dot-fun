import { type HexInput } from "@aptos-labs/ts-sdk";
import { normalizeHex } from "../utils/hex";
import AllSymbolEmojiJSON from "./symbol-emojis.json";
import AllChatEmojiJSON from "./chat-emojis.json";
import {
  type SymbolEmojiName,
  type SymbolEmoji,
  type SymbolEmojiData,
  type ChatEmoji,
  type ChatEmojiName,
  type ChatEmojiData,
} from "./types";

const encoder = new TextEncoder();

const createMaps = <T extends SymbolEmojiData | ChatEmojiData>(entries: Array<T>) => {
  const nameMap = new Map<string, T>(entries.map((v) => [v.name, v]));
  const hexMap = new Map<`0x${string}`, T>(entries.map((v) => [v.hex, v]));
  const emojiMap = new Map<string, T>(entries.map((v) => [v.emoji, v]));

  return {
    byStrictName: (v: T["name"]) => nameMap.get(v)!,
    byName: (v: string) => nameMap.get(v),
    byHex: (v: HexInput) => hexMap.get(normalizeHex(v)),
    byEmojiStrict: (v: T["emoji"]) => emojiMap.get(v)!,
    byEmoji: (v: string) => emojiMap.get(v),
    hasName: (v: string): v is T["name"] => nameMap.has(v),
    hasHex: (v: HexInput) => hexMap.has(normalizeHex(v)),
    hasEmoji: (v: string): v is T["emoji"] => emojiMap.has(v),
  };
};

export const allSymbolEmojis = Object.entries(AllSymbolEmojiJSON).map(([emoji, name]) => {
  const bytes = encoder.encode(emoji);
  const hex = normalizeHex(bytes);
  return {
    name: name as SymbolEmojiName,
    hex,
    bytes,
    emoji: emoji as SymbolEmoji,
  };
});

export const allChatEmojis = Object.entries(AllChatEmojiJSON).map(([emoji, name]) => {
  const bytes = encoder.encode(emoji);
  const hex = normalizeHex(bytes);
  return {
    name: name as ChatEmojiName,
    hex,
    bytes,
    emoji: emoji as ChatEmoji,
  };
});

export const SYMBOL_EMOJI_DATA = createMaps(allSymbolEmojis);
export const CHAT_EMOJI_DATA = createMaps(allChatEmojis);

export const getRandomSymbolEmoji = (): SymbolEmojiData => {
  const randomIndex = Math.floor(allSymbolEmojis.length * Math.random());
  return allSymbolEmojis[randomIndex];
};

export const getRandomChatEmoji = (): ChatEmojiData => {
  const randomIndex = Math.floor(allChatEmojis.length * Math.random());
  return allChatEmojis[randomIndex];
};

export const isSymbolEmoji = (v: string): v is SymbolEmoji => SYMBOL_EMOJI_DATA.hasEmoji(v);
/**
 * Note that this function checks if the emoji is valid as an input for a chat message, not if it's
 * specifically a chat/supplemental emoji.
 */
export const isValidChatMessageEmoji = (v: string): v is SymbolEmoji | ChatEmoji =>
  isSymbolEmoji(v) || CHAT_EMOJI_DATA.hasEmoji(v);
