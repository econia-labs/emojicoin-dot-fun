import { convertJsonMeleeData } from "app/arena/fetch-melee-data";
import { getPrebuildFileData } from "lib/nextjs/prebuild";
import type { MarketDataSortByHomePage } from "lib/queries/sorting/types";
import { toMarketDataSortByHomePage } from "lib/queries/sorting/types";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { IS_NEXT_BUILD_PHASE } from "lib/server-env";

import { toMarketStateModel, toPriceFeed } from "@/sdk/index";

import type { HomePageData } from "./queries";

/**
 * Prebuild data that's used to populate static pages at build time. This removes the need for
 * up to thousands of separate fetches at build time and consolidates them into queries that return
 * multiple rows for generated static params.
 */
export function maybeGetHomePagePrebuildData(args: {
  sort: string;
  page: string;
}): Exclude<HomePageData, { notFound: true }> | undefined {
  if (!IS_NEXT_BUILD_PHASE) return undefined;

  const sort = toMarketDataSortByHomePage(args.sort as MarketDataSortByHomePage);
  const page = safeParsePageWithDefault(args.page);
  const data = getPrebuildFileData();

  if (!data) {
    throw new Error("Couldn't find prebuild data.");
  }

  const markets = data.home_pages[sort][page].map(toMarketStateModel);
  // Keep in mind that this will only throw if this data isn't found at build-time, otherwise this
  // code path should never be entered.
  if (!markets) {
    throw new Error(`Couldn't find build data for /home/[sort]/[page]: /home/[${sort}]/[${page}]`);
  }

  return {
    data: {
      markets,
      numMarkets: data.num_markets,
      priceFeed: data.price_feed.map(toPriceFeed),
      aptPrice: data.apt_price,
      meleeData: data.melee_data ? convertJsonMeleeData(data.melee_data) : null,
      page,
      sortBy: sort,
    },
  };
}
