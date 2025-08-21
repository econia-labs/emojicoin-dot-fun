import type { JsonMeleeDataArgs } from "app/arena/fetch-melee-data";
import { fetchMeleeData } from "app/arena/fetch-melee-data";
import { fetchExchangeRatesAtMeleeStart } from "app/arena/fetch-melee-start-open-price";
import { cacheableMarketStateQuery } from "app/home/queries";
import { generateHomePageStaticParams } from "app/home/static-params";
import FEATURE_FLAGS from "lib/feature-flags";
import type {
  HomePageDataDictionary,
  MarketPageDataDictionary,
  PrebuildData,
} from "lib/nextjs/prebuild";
import { fetchAptPrice } from "lib/queries/get-apt-price";
import { fetchNumRegisteredMarkets } from "lib/queries/num-market";
import { fetchHomePagePriceFeed } from "lib/queries/price-feed";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";

import { fetchArenaInfoJson } from "@/sdk/indexer-v2/queries";

async function fetchAllMeleeData(): Promise<JsonMeleeDataArgs> {
  const arena_info = await fetchArenaInfoJson();
  if (!arena_info) {
    throw new Error("Should be able to fetch arena info at build time.");
  }

  const [melee, { market_0_rate, market_1_rate }] = await Promise.all([
    fetchMeleeData(arena_info),
    fetchExchangeRatesAtMeleeStart(arena_info),
  ]);

  return {
    melee,
    market_0_rate,
    market_1_rate,
  };
}

export async function generatedStaticHomePageData(): Promise<PrebuildData> {
  const staticPages = await generateHomePageStaticParams();
  const pages: HomePageDataDictionary = {
    all_time_vol: {},
    market_cap: {},
    bump: {},
    daily_vol: {},
  };

  const markets: MarketPageDataDictionary = {};

  // Shared data across all markets.
  const [num_markets, apt_price, price_feed, melee_data] = await Promise.all([
    fetchNumRegisteredMarkets(),
    fetchAptPrice(),
    fetchHomePagePriceFeed(),
    FEATURE_FLAGS.Arena ? fetchAllMeleeData() : Promise.resolve(null),
  ]);

  for (const { sort, page: pageString } of staticPages) {
    const sortBy = toMarketDataSortByHomePage(sort);
    const page = Number(pageString);
    const marketStates = await cacheableMarketStateQuery({ page, sortBy });
    pages[sort][page] = marketStates;

    // Add each market to the market page data dictionary to avoid duplicate fetches.
    marketStates.forEach((mkt) => {
      markets[mkt.symbol_emojis.join("")] = mkt;
    });
  }

  return {
    pages,
    markets,
    num_markets,
    price_feed,
    melee_data,
    apt_price,
  };
}
