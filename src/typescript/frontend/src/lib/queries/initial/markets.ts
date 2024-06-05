"use server";

import { SYMBOL_DATA } from "@sdk/emoji_data/";
import { MarketView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { type JSONTypes, toMarketView, toStateEvent } from "@sdk/types";
import { paginateMarketRegistrations, getTopMarkets } from "@sdk/queries/market";
import { APTOS_NETWORK } from "lib/env";
import { cache } from "react";
import fetchInitialWithFallback from "./cache-helper";
import { SAMPLE_DATA_BASE_URL } from "./const";
import { getAptos } from "lib/utils/aptos-client";
import { compareBigInt } from "../../../../../sdk/src/utils/compare-bigint";

export const fetchTopMarkets = cache(async () => {
  if (process.env.FORCE_STATIC_FETCH === "true") {
    const res = await fetch(new URL("top-market-data.json", SAMPLE_DATA_BASE_URL));
    const data = (await res.json()).data as Array<{
      data: JSONTypes.StateEvent;
      version: number;
    }>;
    return data.map((v) => ({
      state: toStateEvent(v.data, v.version),
      emoji: SYMBOL_DATA.byHex(v.data.market_metadata.emoji_bytes)!,
      version: v.version,
      volume24H: BigInt(Math.floor(Math.random() * 1337 ** 4)),
    }));
  }

  const res = await getTopMarkets();

  return res.data.map((v) => ({
    state: toStateEvent(v.data, v.version),
    emoji: SYMBOL_DATA.byHex(v.data.market_metadata.emoji_bytes)!,
    version: v.version,
    volume24H: BigInt(Math.floor(Math.random() * 1337 ** 4)),
  }));
});

const getInitialMarketData = async () => {
  const { markets } = await paginateMarketRegistrations();
  const data = markets.map((m) => ({
    marketID: m.marketMetadata.marketID,
    marketAddress: m.marketMetadata.marketAddress,
    version: m.version,
  }));

  const addresses = data
    .slice(0, 100)
    .map((v) => ({ address: v.marketAddress, version: v.version }));
  const aptos = getAptos(APTOS_NETWORK);

  const marketViews: Array<Promise<JSONTypes.MarketView & { version: number }>> = [];

  // TODO: Replace with SQL query/view later.
  for (let i = 0; i < addresses.length; i += 1) {
    marketViews.push(
      MarketView.view({
        aptos,
        marketAddress: addresses[i].address,
      }).then((res) => ({ ...res, version: addresses[i].version }))
    );
  }

  return await Promise.all(marketViews);
};

const fetchInitialMarketData = cache(async () => {
  const marketViews = await fetchInitialWithFallback({
    functionArgs: undefined,
    queryFunction: getInitialMarketData,
    endpoint: new URL("market-registration-data.json", SAMPLE_DATA_BASE_URL),
  });

  const markets = marketViews.map((mkt) => ({
    emoji: SYMBOL_DATA.byHex(mkt.metadata.emoji_bytes)!,
    market: toMarketView(mkt),
    volume24H: BigInt(Math.floor(Math.random() * 1337 ** 4)), // TODO: Replace with actual volume.
  }));

  // Sort by market cap.
  markets.sort((m1, m2) =>
    compareBigInt(m2.market.instantaneousStats.marketCap, m1.market.instantaneousStats.marketCap)
  );

  return markets;
});

export default fetchInitialMarketData;
