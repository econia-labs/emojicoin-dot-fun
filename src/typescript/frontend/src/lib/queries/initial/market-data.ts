"use server";

import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";
import { SAMPLE_DATA_BASE_URL } from "./const";
import { paginateMarketData } from "@sdk/queries/market-data";
import { SYMBOL_DATA, type SymbolEmojiData } from "@sdk/emoji_data";
import { toMarketDataView, type Types } from "@sdk/types";

type FetchMarketData = Types.MarketDataView & SymbolEmojiData;

const fetchMarketData = cache(async (): Promise<Array<FetchMarketData>> => {
  const marketData = await fetchInitialWithFallback({
    functionArgs: {},
    queryFunction: paginateMarketData,
    endpoint: new URL(`market-data.json`, SAMPLE_DATA_BASE_URL),
  });

  return marketData.map((data) => ({
    ...toMarketDataView(data),
    ...SYMBOL_DATA.byHex(data.emoji_bytes)!,
  }));
});

export default fetchMarketData;
