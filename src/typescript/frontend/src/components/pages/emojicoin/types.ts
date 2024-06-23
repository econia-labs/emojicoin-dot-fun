import { type CandlestickResolution } from "@sdk/const";
import { type SymbolEmojiData } from "@sdk/emoji_data";
import { type Types } from "@sdk/types";
import { type LatestBar } from "@sdk/utils/candlestick-bars";
import { type LatestBarData } from "@store/event-store";

export interface WithVersion {
  version: number;
}
interface DataProps extends Types.MarketDataView {
  swaps: Array<Types.SwapEvent>;
  chats: Array<Types.ChatEvent>;
  candlesticks: Array<Types.PeriodicStateEvent>;
  latestBarData: LatestBarData;
  emojis: Array<SymbolEmojiData>;
  symbol: string;
  marketView: Types.MarketView;
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
  marketID: string;
  initNumSwaps: number;
}
export interface TradeHistoryProps {
  data: Omit<DataProps, "chats">;
}
