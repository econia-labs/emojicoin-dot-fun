import { type getEmojicoinMarketAddressAndTypeTags } from "../markets";
import type AllSymbolEmojiJSON from "./symbol-emojis.json";
import { type symbolBytesToEmojis } from "./utils";

export type AllSymbolEmojiData = typeof AllSymbolEmojiJSON;
export type EmojiName = keyof AllSymbolEmojiData;
export type SymbolEmojiData = {
  hex: `0x${string}`;
  name: EmojiName;
  bytes: Uint8Array;
  emoji: string;
};

export type SymbolData = {
  name: string;
  hex: `0x${string}`;
  bytes: Uint8Array;
  symbol: string;
};

export type RegisteredMarket = {
  symbol: string;
  emojis: SymbolEmojiData[];
  marketID: string;
  symbolBytes: `0x${string}`;
  marketAddress: `0x${string}`;
};

/**
 * Represents either the raw emoji symbol or symbol array or the emoji data.
 * This should *NOT* represent emojis as hex strings/bytes.
 */
export type EmojicoinSymbol = string | string[] | SymbolEmojiData | SymbolEmojiData[];

export type DerivedEmojicoinData = ReturnType<typeof getEmojicoinMarketAddressAndTypeTags> &
  ReturnType<typeof symbolBytesToEmojis> & { symbolBytes: `0x${string}` };
