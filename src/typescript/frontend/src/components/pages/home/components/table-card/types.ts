import { type SymbolEmojiData } from "@sdk/emoji_data";

export type TableCardProps = {
  index: number;
  symbol: string;
  marketID: number;
  emojis: Array<SymbolEmojiData>;
  marketCap: string;
  volume24h: string;
};
