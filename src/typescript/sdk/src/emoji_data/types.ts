import type AllSymbolEmojiJSON from "./symbol-emojis.json";

export type AllSymbolEmojiData = typeof AllSymbolEmojiJSON;
export type EmojiName = keyof AllSymbolEmojiData;
export type SymbolEmojiData = {
  hex: `0x${string}`;
  name: EmojiName;
  bytes: Uint8Array;
  emoji: string;
};

export type RegisteredMarket = {
  symbol: string;
  emojis: SymbolEmojiData[];
  marketID: string;
  symbolBytes: `0x${string}`;
  marketAddress: `0x${string}`;
};
