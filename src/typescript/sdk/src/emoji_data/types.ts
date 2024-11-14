import { type MarketMetadataModel } from "../indexer-v2/types";
import { type getEmojicoinMarketAddressAndTypeTags } from "../markets";
import type AllSymbolEmojiJSON from "./symbol-emojis.json";
import type AllChatEmojiJSON from "./chat-emojis.json";
import { type symbolBytesToEmojis } from "./utils";
// Note the name data JSON files are not duplicated data, they are purely for type resolution.
import type SymbolNamesJSON from "./symbol-names.json";
import type ChatNamesJSON from "./chat-names.json";

export type AllSymbolEmojiData = typeof AllSymbolEmojiJSON;
export type SymbolEmoji = keyof AllSymbolEmojiData;
export type SymbolEmojiName = keyof typeof SymbolNamesJSON;

export type AllChatEmojiData = typeof AllChatEmojiJSON;
export type ChatEmoji = keyof AllChatEmojiData;
export type ChatEmojiName = keyof typeof ChatNamesJSON;

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

/**
 * Represents either the raw emoji symbol or symbol array or the emoji data.
 * This should *NOT* represent emojis as hex strings/bytes.
 */
export type EmojicoinSymbol = string | string[] | SymbolEmojiData | SymbolEmojiData[];

export type DerivedEmojicoinData = ReturnType<typeof getEmojicoinMarketAddressAndTypeTags> &
  ReturnType<typeof symbolBytesToEmojis> & { symbolBytes: `0x${string}` };
