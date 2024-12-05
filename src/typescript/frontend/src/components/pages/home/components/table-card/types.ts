import { type SymbolEmojiData } from "@sdk/emoji_data";
import { type MarketDataSortByHomePage } from "lib/queries/sorting/types";

export type TableCardProps = {
  index: number;
  symbol: string;
  marketID: number;
  emojis: Array<SymbolEmojiData>;
  staticMarketCap: bigint;
  staticVolume24H: bigint;
  prevIndex?: number;
};

export type GridLayoutInformation = {
  rowLength: number;
  pageOffset: number;
  sortBy: MarketDataSortByHomePage;
  runInitialAnimation?: boolean;
};
