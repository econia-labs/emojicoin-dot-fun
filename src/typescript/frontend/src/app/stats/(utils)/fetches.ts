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

/**
 * The number of markets that show up in the price delta percentage query is different than the total
 * number of markets. It's not necessary to know this in the `/api/stats` route, but it's relevant
 * for the frontend because of the pagination buttons block.
 * Swap out the max page number with the number of markets returned in the price feed query.
 * Since this can be run infrequently and it's an extra call, cache this value for longer.
 */
export const fetchCachedNumMarketsWithDailyActivity = unstableCacheWrapper(
  async (): Promise<number> =>
    postgrest
      .from(TableName.PriceFeed)
      .select(undefined, { count: "exact" })
      .then((res) => res.count ?? 0),
  ["num-markets-with-daily-activity"],
  {
    revalidate: 30,
    tags: ["num-markets-with-daily-activity"],
  }
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

  const res = await fetchCachedPaginatedMarketStats(validatedParams).then((data) => ({
    maxPageNumber: getMaxPageNumber(totalNumMarkets, STATS_MARKETS_PER_PAGE),
    data,
    ...validatedParams,
  }));
  const { maxPageNumber: maxPageNumberFromRes, page, sort, order, data } = res;

  const maxPageNumber =
    sort === "delta"
      ? await fetchCachedNumMarketsWithDailyActivity().then((num) =>
          getMaxPageNumber(num, STATS_MARKETS_PER_PAGE)
        )
      : maxPageNumberFromRes;

  return {
    maxPageNumber,
    page,
    sort,
    order: toOrderByString(order),
    data,
  };
}
