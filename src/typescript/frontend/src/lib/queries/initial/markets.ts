"use server";

import { SYMBOL_DATA } from "@sdk/emoji_data/";
import { MarketView } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { type JSONTypes, toMarketView } from "@sdk/types";
import { paginateMarketRegistrations } from "@sdk/queries/market";
import { APTOS_NETWORK } from "lib/env";
import { cache } from "react";
import fetchInitialWithFallback from "./cache-helper";
import { getAptos } from "lib/utils/aptos-client";
import { compareBigInt } from "@sdk/utils/compare-bigint";

const getInitialMarketDataFromFullnode = async () => {
  // TODO: Change this to not rely on our indexer at all, but entirely on the fullnode API.
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

const fetchInitialMarketDataFromFullnode = cache(async () => {
  const marketViews = await fetchInitialWithFallback({
    functionArgs: undefined,
    queryFunction: getInitialMarketDataFromFullnode,
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

export default fetchInitialMarketDataFromFullnode;
