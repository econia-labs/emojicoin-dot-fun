import { type SymbolEmojiData } from "@sdk/emoji_data";
import { type Types } from "@sdk/types";

export interface WithVersion {
  version: number;
}
interface DataProps extends Types.MarketDataView {
  swaps: Array<Types.SwapEvent>;
  chats: Array<Types.ChatEvent>;
  candlesticks: Array<Types.PeriodicStateEvent>;
  emojis: Array<SymbolEmojiData>;
  symbol: string;
}

export interface EmojicoinProps {
  data: DataProps;
}

export interface MainInfoProps {
  data: Omit<DataProps, "swaps" | "chats">;
}

export interface GridProps {
  data: DataProps;
}

export interface ChatProps {
  data: Omit<DataProps, "swaps">;
}
export interface SwapComponentProps {
  emojicoin: string;
  marketAddress: string;
  numSwaps: number;
}
export interface TradeHistoryProps {
  data: Omit<DataProps, "chats">;
}
