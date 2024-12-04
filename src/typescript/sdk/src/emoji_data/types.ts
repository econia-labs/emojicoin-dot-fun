import { type MarketMetadataModel } from "../indexer-v2/types";
import { CHAT_EMOJIS } from "./chat-emojis";
import { SYMBOL_EMOJIS } from "./symbol-emojis";

export type SymbolEmoji = keyof typeof SYMBOL_EMOJIS;
export type SymbolEmojiName = (typeof SYMBOL_EMOJIS)[keyof typeof SYMBOL_EMOJIS];
export type ChatEmoji = keyof typeof CHAT_EMOJIS;
export type ChatEmojiName = (typeof CHAT_EMOJIS)[keyof typeof CHAT_EMOJIS];

export type AnyEmoji = SymbolEmoji | ChatEmoji;
export type AnyEmojiName = SymbolEmojiName | ChatEmojiName;

/**
 * A single symbol emoji's data.
 */
export type SymbolEmojiData = {
  hex: `0x${string}`;
  name: SymbolEmojiName;
  bytes: Uint8Array;
  emoji: SymbolEmoji;
};

/**
 * A single (supplemental) chat emoji's data.
 *
 * Note that for the purposes of types, this does not include symbol emojis, although on-chain,
 * the set of valid chat emojis is the superset of `SymbolEmoji`s and `ChatEmoji`s.
 *
 * This is strictly for distinguishing between symbol and supplemental emojis in the TypeScript SDK.
 */
export type ChatEmojiData = {
  hex: `0x${string}`;
  name: ChatEmojiName;
  bytes: Uint8Array;
  emoji: ChatEmoji;
};

export type AnyEmojiData = SymbolEmojiData | ChatEmojiData;

/**
 * The final concatenated symbol data for a market symbol. This will consist of data for one or
 * more symbol emojis.
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
