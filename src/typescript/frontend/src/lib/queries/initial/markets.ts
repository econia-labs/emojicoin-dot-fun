import { SYMBOL_DATA, getEmojiData } from "@/sdk/emoji_data/";
import { MarketView } from "@/sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { toCoinTypes } from "@/sdk/markets/utils";
import { type JSONTypes, toMarketView } from "@/sdk/types";
import { paginateMarketRegistrations } from "@/sdk/queries/market";
import { getAptos } from "@/sdk/utils/aptos-client";
import { APTOS_NETWORK } from "lib/env";
import { cache } from "react";
import { UnitOfTime, getTime } from "@/sdk/utils";

/**
 * We cache this function with the key as the current time, the current network, and the inbox url.
 *
 * To cache this with low granularity, we use a period boundary of an hour.
 *
 * This function is only called at build time so we don't need to store a highly granular cache.
 * @returns
 */
const getInitialMarketData = cache(async (args: { vercel: boolean; local: boolean; time: number }) => {
  // Fallback to use for production data in case we don't have a remote database endpoint set up.
  if (args.local && args.vercel) {
    console.warn("Warning: The `inbox` endpoint URL is set to `localhost` in production. Using sample market data.");
    const sampleDataURL = "https://sample-data.sfo3.cdn.digitaloceanspaces.com/data.json";
    const response = await fetch(sampleDataURL);
    const data: Array<JSONTypes.MarketView> = await response.json();
    const markets = data.map(market => ({
      market: toMarketView(market),
      emoji: getEmojiData(market.metadata.emoji_bytes)!,
      volume24H: BigInt(Math.floor(Math.random() * 1337 ** 3)),
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
  } else {
    return fetchInitialMarketData();
  }
});

const getCachedMarketData = async () => {
  const currentHour = Math.floor(getTime(UnitOfTime.Hours));
  console.log("Current hour:", currentHour);

  return await getInitialMarketData({
    vercel: process.env.VERCEL === "1",
    local: process.env.INBOX_URL === "http://localhost:3000",
    time: currentHour,
  });
};

const fetchInitialMarketData = async () => {
  const { markets } = await paginateMarketRegistrations();
  const data = markets.map(m => ({
    marketID: m.marketMetadata.marketID,
    marketAddress: m.marketMetadata.marketAddress,
  }));

  const sliced = data.slice(0, 100).map(d => {
    const { emojicoin: t1, emojicoinLP: t2 } = toCoinTypes(d.marketAddress);
    return {
      ...d,
      emojicoin: t1,
      emojicoinLP: t2,
    };
  });

  const addresses = sliced.map(v => v.marketAddress);
  const t1 = sliced.map(v => v.emojicoin);
  const t2 = sliced.map(v => v.emojicoinLP);
  const aptos = getAptos(APTOS_NETWORK);

  const asyncResults: Array<Promise<JSONTypes.MarketView>> = [];

  // TODO: Replace with SQL query/view later.
  for (let i = 0; i < addresses.length; i += 1) {
    asyncResults.push(
      MarketView.view({
        aptos,
        marketAddress: addresses[i],
        typeTags: [t1[i], t2[i]],
      }),
    );
  }

  const marketViews = (await Promise.all(asyncResults)).map(v => ({
    emoji: SYMBOL_DATA.byHex(v.metadata.emoji_bytes)!,
    market: toMarketView(v),
    // TODO: Replace this with a real value later.
    volume24H: BigInt(Math.floor(Math.random() * 1337 ** 4)),
  }));

  // Sort by market cap.
  marketViews.sort((m1, m2) =>
    m2.market.instantaneousStats.marketCap < m1.market.instantaneousStats.marketCap
      ? -1
      : m2.market.instantaneousStats.marketCap > m1.market.instantaneousStats.marketCap
        ? 1
        : 0,
  );

  return marketViews;
};

export default getCachedMarketData;
