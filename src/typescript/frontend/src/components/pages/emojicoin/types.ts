import { type SymbolEmojiData } from "@/sdk/emoji_data";
import { type ContractTypes } from "@/sdk/types";

export interface EmojicoinProps {
  data?: {
    chats: Array<ContractTypes.ChatEvent>;
    emoji: SymbolEmojiData;
    market: ContractTypes.MarketView;
  };
}
