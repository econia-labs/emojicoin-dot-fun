import { type SymbolEmojiData } from "@sdk/emoji_data";

export type TableCardProps = {
  index: number;
  symbol: string;
  marketID: number;
  emojis: Array<SymbolEmojiData>;
  staticNumSwaps: string;
  staticMarketCap: string;
  staticVolume24H: string;
};
