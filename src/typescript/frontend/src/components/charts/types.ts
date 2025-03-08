import { type SymbolEmojiData } from "@sdk/emoji_data";
export interface ChartContainerProps {
  symbol: string;
  emojis: SymbolEmojiData[];
  secondarySymbol?: string;
}
