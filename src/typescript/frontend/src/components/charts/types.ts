import { type SymbolEmojiData } from "@sdk/emoji_data";

export type ChartContainerProps = {
  symbol: string;
  emojis: SymbolEmojiData[];
  secondarySymbol?: string;
};
