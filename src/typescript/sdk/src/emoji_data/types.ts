import type AllSymbolEmojiJSON from "./symbol-emojis.json";

export type AllSymbolEmojiData = typeof AllSymbolEmojiJSON;
export type SymbolEmojiData = {
  hex: `0x${string}`;
  name: string;
  bytes: Uint8Array;
  emoji: string;
};
export type EmojiName = keyof AllSymbolEmojiData;
