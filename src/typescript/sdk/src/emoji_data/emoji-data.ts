import { type HexInput } from "@aptos-labs/ts-sdk";
import { normalizeHex } from "../utils/hex";
import { SYMBOL_EMOJIS } from "./symbol-emojis";
import { CHAT_EMOJIS } from "./chat-emojis";
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

export const allSymbolEmojis = Object.entries(SYMBOL_EMOJIS).map(([emoji, name]) => {
  const bytes = encoder.encode(emoji);
  const hex = normalizeHex(bytes);
  return {
    name: name as SymbolEmojiName,
    hex,
    bytes,
    emoji: emoji as SymbolEmoji,
  };
});

export const allChatEmojis = Object.entries(CHAT_EMOJIS).map(([emoji, name]) => {
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
 * Note that this function only checks if the emoji is a supplemental chat emoji, not if it's a
 * valid input emoji for a chat message in the `emojicoin_dot_fun.move` `chat` entry function.
 */
export const isChatEmoji = (v: string): v is ChatEmoji => CHAT_EMOJI_DATA.hasEmoji(v);
/**
 * Note that this function checks if the emoji is valid as an input for a chat message, not if it's
 * specifically a chat/supplemental emoji.
 */
export const isValidChatMessageEmoji = (v: string): v is SymbolEmoji | ChatEmoji =>
  isSymbolEmoji(v) || isChatEmoji(v);
