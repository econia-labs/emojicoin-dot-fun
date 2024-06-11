"use server";

import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";
import { paginateMarketData } from "@sdk/queries/market-data";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { toMarketDataView, type Types } from "@sdk/types";

type FetchMarketData = Types.MarketDataView & ReturnType<typeof symbolBytesToEmojis>;

const fetchMarketData = cache(async (): Promise<Array<FetchMarketData>> => {
  const marketData = await fetchInitialWithFallback({
    functionArgs: {},
    queryFunction: paginateMarketData,
  });

  return marketData.map((data) => ({
    ...toMarketDataView(data),
    ...symbolBytesToEmojis(data.emoji_bytes),
  }));
});

export default fetchMarketData;
