import { type SymbolEmojiData } from "@/sdk/emoji_data";
import { type ContractTypes } from "@/sdk/types";

interface DataProps {
  swaps: Array<ContractTypes.SwapEvent>;
  chats: Array<ContractTypes.ChatEvent>;
  emoji: SymbolEmojiData;
  market: ContractTypes.MarketView;
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
