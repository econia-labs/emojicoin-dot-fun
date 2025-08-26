import type { JsonMeleeDataArgs } from "app/arena/fetch-melee-data";
import { fetchMeleeData } from "app/arena/fetch-melee-data";
import { fetchExchangeRatesAtMeleeStart } from "app/arena/fetch-melee-start-open-price";
import { generateHomePageStaticParams } from "app/home/static-params";
import { fetchNumMarketsWithDailyActivity } from "app/stats/(utils)/fetches";
import { STATS_MARKETS_PER_PAGE } from "app/stats/(utils)/schema";
import { generateStatsPageStaticParams } from "app/stats/(utils)/static-params";
import { fetchPaginatedMarketStats } from "app/stats/(utils)/stats-query";
import FEATURE_FLAGS from "lib/feature-flags";
import type {
  HomePageDataDictionary,
  MarketPageDataDictionary,
  PrebuildData,
  StatsPageDataDictionary,
} from "lib/nextjs/prebuild";
import { fetchAptPrice } from "lib/queries/get-apt-price";
import { fetchNumRegisteredMarkets } from "lib/queries/num-market";
import { fetchHomePagePriceFeed } from "lib/queries/price-feed";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";

import { chunk, enumerate } from "@/sdk/index";
import { MAX_ROW_LIMIT, ORDER_BY, toOrderBy } from "@/sdk/indexer-v2";
import { exhaustiveFetch, fetchArenaInfoJson, fetchMarketsJson } from "@/sdk/indexer-v2/queries";

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

const pageSize = MAX_ROW_LIMIT;
if (MAX_ROW_LIMIT % STATS_MARKETS_PER_PAGE || MAX_ROW_LIMIT % MARKETS_PER_PAGE) {
  throw new Error("Max row limit should be perfectly divisible.");
}

export async function generateStaticData(): Promise<PrebuildData> {
  // Shared data across all markets.
  const [num_markets, apt_price, price_feed, melee_data, num_markets_with_daily_activity] =
    await Promise.all([
      fetchNumRegisteredMarkets(),
      fetchAptPrice(),
      fetchHomePagePriceFeed(),
      FEATURE_FLAGS.Arena ? fetchAllMeleeData() : Promise.resolve(null),
      fetchNumMarketsWithDailyActivity(),
    ]);

  const stats_pages = await staticStatsPageData();
  const { home_pages, markets } = await staticHomePageData();

  return {
    stats_pages,
    home_pages,
    markets,
    num_markets,
    num_markets_with_daily_activity,
    price_feed,
    melee_data,
    apt_price,
  };
}

async function staticStatsPageData() {
  const staticStatsPages = await generateStatsPageStaticParams();

  const stats_pages: StatsPageDataDictionary = {
    all_time_vol: {},
    market_cap: {},
    delta: {},
    daily_vol: {},
    price: {},
    tvl: {},
  };

  // Initialize all entries in the dictionary.
  for (const { sort, page: pageString } of staticStatsPages) {
    const page = Number(pageString);
    stats_pages[sort][page] = { asc: [], desc: [] };
  }

  // Then fetch all the static stats page data and replace in the dictionary if there are any rows.
  for (const { sort, page: pageString, order } of staticStatsPages) {
    // The market data is chunked and fetched exhaustively, forgoing page iteration.
    if (pageString !== "1") continue;

    const fetchFunction = (page: number) =>
      fetchPaginatedMarketStats({ page, pageSize, order: toOrderBy(order), sort });
    const allMarkets = await exhaustiveFetch(fetchFunction, pageSize);
    const chunks = chunk(allMarkets, STATS_MARKETS_PER_PAGE);

    for (const [pageChunk, i] of enumerate(chunks)) {
      const page = i + 1;
      stats_pages[sort][page][order] = pageChunk;
    }
  }

  return stats_pages;
}

async function staticHomePageData() {
  const staticHomePages = await generateHomePageStaticParams();
  const markets: MarketPageDataDictionary = {};

  const home_pages: HomePageDataDictionary = {
    all_time_vol: {},
    market_cap: {},
    bump: {},
    daily_vol: {},
  };

  // Initialize all entries in the dictionary.
  for (const { sort, page: pageString } of staticHomePages) {
    const page = Number(pageString);
    home_pages[sort][page] = [];
  }

  // Then fetch all the static home page data and replace in the dictionary if there are any rows.
  for (const { sort } of staticHomePages) {
    const fetchFunction = (page: number) =>
      fetchMarketsJson({ page, pageSize, orderBy: ORDER_BY.DESC, sortBy: sort });
    const allMarkets = await exhaustiveFetch(fetchFunction, pageSize);
    const chunks = chunk(allMarkets, MARKETS_PER_PAGE);
    for (const [pageChunk, i] of enumerate(chunks)) {
      const page = i + 1;
      home_pages[sort][page] = pageChunk;
    }
    // Add each market to a dictionary to avoid duplicate fetches on individual market pages later.
    allMarkets.forEach((mkt) => {
      markets[mkt.symbol_emojis.join("")] = mkt;
    });
  }

  return { home_pages, markets };
}
