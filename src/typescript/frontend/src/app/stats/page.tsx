// Don't cache the page- just server render it.
// The data caching is done in the API route, not in the
// react rendered server component.

import fetchCachedFullMarketStatsQuery from "app/api/stats/full-query";
import { STATS_MARKETS_PER_PAGE, type StatsSchemaInput } from "app/api/stats/schema";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import { TableName, toPriceFeedWithNulls } from "@/sdk/index";
import { postgrest } from "@/sdk/indexer-v2";

import StatsPageComponent from "./StatsPage";

export interface StatsPageParams {
  params?: {};
  searchParams?: StatsSchemaInput;
}

/**
 * The number of markets that show up in the price delta percentage query is different than the total
 * number of markets. It's not necessary to know this in the `/api/stats` route, but it's relevant
 * for the frontend because of the pagination buttons block.
 * Swap out the max page number with the number of markets returned in the price feed query.
 * Since this can be run infrequently and it's an extra call, cache this value for longer.
 */
const fetchCachedNumMarketsWithDailyActivity = unstableCacheWrapper(
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

export default async function Stats({ searchParams }: StatsPageParams) {
  const params = searchParams ?? {};
  const res = await fetchCachedFullMarketStatsQuery(params).then(({ data, ...rest }) => ({
    ...rest,
    data: data.map(toPriceFeedWithNulls),
  }));
  const { maxPageNumber: maxPageNumberFromRes, page, sortBy, orderBy, data } = res;

  const maxPageNumber =
    sortBy === "delta"
      ? await fetchCachedNumMarketsWithDailyActivity().then((num) =>
          getMaxPageNumber(num, STATS_MARKETS_PER_PAGE)
        )
      : maxPageNumberFromRes;

  return (
    <StatsPageComponent
      maxPageNumber={maxPageNumber}
      page={page}
      sortBy={sortBy}
      orderBy={orderBy}
      data={data}
    />
  );
}
