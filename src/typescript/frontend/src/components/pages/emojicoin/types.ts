import { type SymbolEmojiData } from "@sdk/emoji_data";
import { type Types } from "@sdk/types";

export interface WithVersion {
  version: number;
}
interface DataProps extends SymbolEmojiData, Types.MarketDataView {
  swaps: Array<Types.SwapEvent & { version: number }>;
  chats: Array<Types.ChatEvent & { version: number }>;
}

export interface EmojicoinProps {
  data?: DataProps;
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

export interface TradeEmojicoinProps {
  data: Omit<DataProps, "chats" | "swaps">;
}

export interface TradeHistoryProps {
  data: Omit<DataProps, "chats">;
}
