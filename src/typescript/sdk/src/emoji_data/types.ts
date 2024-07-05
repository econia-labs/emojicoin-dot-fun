import type AllSymbolEmojiJSON from "./symbol-emojis.json";
import { symbolBytesToEmojis } from "./utils";

export type AllSymbolEmojiData = typeof AllSymbolEmojiJSON;
export type SymbolEmojiData = {
  hex: `0x${string}`;
  name: string;
  bytes: Uint8Array;
  emoji: string;
};
export type EmojiName = keyof AllSymbolEmojiData;

export type RegisteredMarket = {
  symbol: string;
  emojis: SymbolEmojiData[];
  marketID: string;
  symbolBytes: `0x${string}`;
  marketAddress: `0x${string}`;
};
