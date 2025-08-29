import type { SymbolEmoji } from "@/sdk/emoji_data/types";
import type { AccountAddressString } from "@/sdk/emojicoin_dot_fun";
import type { DatabaseModels, MarketMetadataModel } from "@/sdk/indexer-v2/types";
import type { SymbolString } from "@/store/event/types";

type DataProps = MarketMetadataModel & {
  symbol: SymbolString;
  state: DatabaseModels["market_state"];
};

export interface EmojicoinProps {
  data: DataProps;
}

export interface MainInfoProps {
  data: DataProps;
}

export interface GridProps {
  data: DataProps;
}

export interface ChatProps {
  data: DataProps;
}
export interface SwapComponentProps {
  emojicoin: string;
  marketAddress: AccountAddressString;
  marketEmojis: SymbolEmoji[];
}
export interface TradeHistoryProps {
  data: DataProps;
}
