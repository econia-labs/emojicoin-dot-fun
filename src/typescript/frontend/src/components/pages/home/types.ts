import { type SymbolEmojiData } from "@/sdk/emoji_data/types";
import { type ContractTypes } from "@/sdk/types/contract-types";

export interface MarketStateProps {
  state: ContractTypes.StateEvent;
  emoji: SymbolEmojiData;
  volume24H: bigint;
  version?: number;
}
