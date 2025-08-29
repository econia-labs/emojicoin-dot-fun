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

import { SortMarketsBy } from "@/sdk/index";
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
  const home_pages = await staticHomePageData();
  const markets = await staticMarketPageData();

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
  for (const { sort, page: pageString, order } of staticStatsPages) {
    const page = Number(pageString);
    if (!(page in stats_pages[sort])) {
      stats_pages[sort][page] = { asc: [], desc: [] };
    }

    stats_pages[sort][page][order] = await fetchPaginatedMarketStats({
      page,
      pageSize: STATS_MARKETS_PER_PAGE,
      order: toOrderBy(order),
      sort,
    });
  }
  return stats_pages;
}

async function staticHomePageData() {
  const staticHomePages = await generateHomePageStaticParams();

  const home_pages: HomePageDataDictionary = {
    all_time_vol: {},
    market_cap: {},
    bump: {},
    daily_vol: {},
  };

  // Initialize all entries in the dictionary.
  for (const { sort, page: pageString } of staticHomePages) {
    const page = Number(pageString);
    home_pages[sort][page] = await fetchMarketsJson({
      page,
      pageSize: MARKETS_PER_PAGE,
      sortBy: sort,
      orderBy: ORDER_BY.DESC,
    });
  }
  return home_pages;
}

async function staticMarketPageData(): Promise<MarketPageDataDictionary> {
  const pageSize = MAX_ROW_LIMIT;
  // Fetch all markets. Note that order and sort by values are irrelevant since this is just
  // populating each market's entry in a dictionary.
  const fetchFunction = (page: number) =>
    fetchMarketsJson({
      page,
      pageSize,
      orderBy: ORDER_BY.DESC,
      sortBy: SortMarketsBy.MarketCap,
    });
  const allMarkets = await exhaustiveFetch(fetchFunction, pageSize);
  const entries = allMarkets.map((mkt) => [mkt.symbol_emojis.join(""), mkt]);
  return Object.fromEntries(entries);
}
