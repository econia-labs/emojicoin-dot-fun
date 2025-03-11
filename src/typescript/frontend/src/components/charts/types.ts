import { type SymbolEmojiData } from "@sdk/emoji_data";
import { type ClassValue } from "clsx";
export interface ChartContainerProps {
  symbol: string;
  emojis: SymbolEmojiData[];
  secondarySymbol?: string;
  className?: ClassValue;
}
