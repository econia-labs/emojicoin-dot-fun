import type { StatsColumn } from "app/stats/(utils)/schema";
import { createStatsSchema, STATS_MARKETS_PER_PAGE } from "app/stats/(utils)/schema";
import fetchCachedPaginatedMarketStats from "app/stats/(utils)/stats-query";
import { getPrebuildFileData } from "lib/nextjs/prebuild";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { fetchCachedNumRegisteredMarkets } from "lib/queries/num-market";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import type { DatabaseJsonType } from "@/sdk/index";
import { type OrderByStrings, toOrderByString } from "@/sdk/indexer-v2";
import { postgrest } from "@/sdk/indexer-v2/queries/client";
import { TableName } from "@/sdk/indexer-v2/types/json-types";

import type { StatsPageParams } from "../page";

export const fetchNumMarketsWithDailyActivity = async () =>
  postgrest
    .from(TableName.PriceFeed)
    .select(undefined, { count: "exact" })
    .then((res) => res.count ?? 0);

/**
 * The number of markets that show up in the price delta percentage query is different than the total
 * number of markets. It's relevant for the frontend because of the pagination buttons block.
 */
export const fetchCachedNumMarketsWithDailyActivity = unstableCacheWrapper(
  fetchNumMarketsWithDailyActivity,
  "num-markets-with-daily-activity",
  { revalidate: 30 }
);

export type StatsPageData = {
  maxPageNumber: number;
  page: number;
  sort: StatsColumn;
  order: OrderByStrings;
  data: DatabaseJsonType["price_feed_with_nulls"][];
};

export async function getStatsPageData({
  params = {},
}: StatsPageParams): Promise<{ notFound: true } | StatsPageData> {
  const totalNumMarkets =
    getPrebuildFileData()?.num_markets ?? (await fetchCachedNumRegisteredMarkets());
  const { data: validatedParams, success } = createStatsSchema(totalNumMarkets).safeParse(params);

  if (!success) return { notFound: true };

  const { page, sort, order: orderBy } = validatedParams;
  const order = toOrderByString(orderBy);

  const numMarketsDailyActivity =
    sort === "delta"
      ? (getPrebuildFileData()?.num_markets_with_daily_activity ??
        (await fetchCachedNumMarketsWithDailyActivity()))
      : undefined;

  const maxDeltaPages = numMarketsDailyActivity
    ? getMaxPageNumber(numMarketsDailyActivity, STATS_MARKETS_PER_PAGE)
    : undefined;

  if (maxDeltaPages !== undefined) {
    if (page > maxDeltaPages) {
      return { notFound: true };
    }
  }
  const data =
    getPrebuildFileData()?.stats_pages[sort][page][order] ??
    (await fetchCachedPaginatedMarketStats(validatedParams));
  const maxPageNumber =
    sort === "delta" && maxDeltaPages !== undefined
      ? maxDeltaPages
      : getMaxPageNumber(totalNumMarkets, STATS_MARKETS_PER_PAGE);

  return {
    maxPageNumber,
    page,
    sort,
    order,
    data,
  };
}
