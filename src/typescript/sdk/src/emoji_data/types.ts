import { type MarketMetadataModel } from "../indexer-v2/types";
import { type getEmojicoinMarketAddressAndTypeTags } from "../markets";
import type AllSymbolEmojiJSON from "./symbol-emojis.json";
import { type symbolBytesToEmojis } from "./utils";

export type AllSymbolEmojiData = typeof AllSymbolEmojiJSON;
export type SymbolEmoji = keyof AllSymbolEmojiData;
export type EmojiName = AllSymbolEmojiData[SymbolEmoji];

export type MarketSymbolEmojis = SymbolEmoji[];

/**
 * A single emoji's data.
 */
export type SymbolEmojiData = {
  hex: `0x${string}`;
  name: EmojiName;
  bytes: Uint8Array;
  emoji: SymbolEmoji;
};

export type ChatEmojiData = Omit<SymbolEmojiData, "emoji"> & {
  emoji: string;
};

/**
 * The final concatenated symbol data for a market symbol. This will consist of data for one or
 * more emojis.
 */
export type SymbolData = {
  name: string;
  hex: `0x${string}`;
  bytes: Uint8Array;
  symbol: string;
};

export type RegisteredMarketInfo = Pick<
  MarketMetadataModel,
  "marketID" | "emojis" | "symbolEmojis" | "symbolData"
>;

/**
 * Represents either the raw emoji symbol or symbol array or the emoji data.
 * This should *NOT* represent emojis as hex strings/bytes.
 */
export type EmojicoinSymbol = string | string[] | SymbolEmojiData | SymbolEmojiData[];

export type DerivedEmojicoinData = ReturnType<typeof getEmojicoinMarketAddressAndTypeTags> &
  ReturnType<typeof symbolBytesToEmojis> & { symbolBytes: `0x${string}` };
