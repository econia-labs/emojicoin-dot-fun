import { type SymbolEmojiData } from "@sdk/emoji_data";
export interface ChartContainerProps {
  marketID: string;
  isScriptReady: boolean;
  emojis: Array<SymbolEmojiData>;
  symbol: string;
}
