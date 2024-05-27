import { SYMBOL_DATA } from "@/sdk/emoji_data/";
import { MarketView } from "@/sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { type JSONTypes, toMarketView } from "@/sdk/types";
import { paginateMarketRegistrations } from "@/sdk/queries/market";
import { getAptos } from "@/sdk/utils/aptos-client";
import { APTOS_NETWORK } from "lib/env";
import { cache } from "react";
import fetchInitialWithFallback from "./cache-helper";
import { SAMPLE_DATA_BASE_URL } from "./const";

const fetchInitialMarketData = async () => {
  const { markets } = await paginateMarketRegistrations();
  const data = markets.map(m => ({
    marketID: m.marketMetadata.marketID,
    marketAddress: m.marketMetadata.marketAddress,
  }));

  const addresses = data.slice(0, 100).map(v => v.marketAddress);
  const aptos = getAptos(APTOS_NETWORK);

  const marketViews: Array<Promise<JSONTypes.MarketView>> = [];

  // TODO: Replace with SQL query/view later.
  for (let i = 0; i < addresses.length; i += 1) {
    marketViews.push(
      MarketView.view({
        aptos,
        marketAddress: addresses[i],
      }),
    );
  }

  return await Promise.all(marketViews);
};

const getInitialMarketData = cache(async () => {
  const marketViews: Array<JSONTypes.MarketView> = await fetchInitialWithFallback({
    functionArgs: undefined,
    queryFunction: fetchInitialMarketData,
    endpoint: new URL("market-registration-data.json", SAMPLE_DATA_BASE_URL),
  });

  const markets = marketViews.map(mkt => ({
    emoji: SYMBOL_DATA.byHex(mkt.metadata.emoji_bytes)!,
    market: toMarketView(mkt),
    volume24H: BigInt(Math.floor(Math.random() * 1337 ** 4)), // TODO: Replace with actual volume.
  }));

  // Sort by market cap.
  markets.sort((m1, m2) =>
    m2.market.instantaneousStats.marketCap < m1.market.instantaneousStats.marketCap
      ? -1
      : m2.market.instantaneousStats.marketCap > m1.market.instantaneousStats.marketCap
        ? 1
        : 0,
  );

  return markets;
});

export default getInitialMarketData;
