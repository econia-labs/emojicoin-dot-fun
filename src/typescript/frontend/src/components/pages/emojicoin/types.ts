import { type SymbolEmojiData } from "@sdk/emoji_data";
import { type ContractTypes } from "@sdk/types";

export interface WithVersion {
  version: number;
}
interface DataProps {
  swaps: Array<ContractTypes.SwapEvent & { version: number }>;
  chats: Array<ContractTypes.ChatEvent & { version: number }>;
  emoji: SymbolEmojiData;
  market: ContractTypes.MarketRegistrationEvent & { version: number };
  state: ContractTypes.StateEvent & { version: number };
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
