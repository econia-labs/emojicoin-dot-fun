import { type SymbolString } from "@/store/event/types";
import { type MarketSymbolEmojis } from "@sdk/emoji_data";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type MarketMetadataModel, type TableModels } from "@sdk/indexer-v2/types";
import { type Types } from "@sdk/types";

export interface WithVersion {
  version: number;
}
type DataProps = MarketMetadataModel & {
  symbol: SymbolString;
  swaps: Array<TableModels["swap_events"]>;
  chats: Array<TableModels["chat_events"]>;
  state: TableModels["market_state"];
  marketView: Types.MarketView;
};

export interface EmojicoinProps {
  data: DataProps;
  geoblocked: boolean;
}

export interface MainInfoProps {
  data: Omit<DataProps, "swaps" | "chats">;
}

export interface GridProps {
  data: DataProps;
  geoblocked: boolean;
}

export interface ChatProps {
  data: Omit<DataProps, "swaps">;
  geoblocked: boolean;
}
export interface SwapComponentProps {
  emojicoin: string;
  marketAddress: AccountAddressString;
  marketEmojis: MarketSymbolEmojis;
  initNumSwaps: number;
  geoblocked: boolean;
}
export interface TradeHistoryProps {
  data: Omit<DataProps, "chats">;
}
