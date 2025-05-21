// Don't cache the page- just server render it.
// The data caching is done in the API route, not in the
// react rendered server component.

import fetchCachedFullMarketStatsQuery from "app/api/stats/full-query";
import { getMaxStatsPageNumber, type StatsSchemaInput } from "app/api/stats/schema";
import { unstable_cache } from "next/cache";

import { TableName, toPriceFeedWithNulls } from "@/sdk/index";
import { postgrest } from "@/sdk/indexer-v2";

import { StatsButtonsBlock } from "./PaginationButtons";
import StatsPageComponent from "./StatsPage";

export const revalidate = 0;
export const dynamic = "force-dynamic";

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
const fetchCachedNumMarketsWithDailyActivity = unstable_cache(
  async () =>
    postgrest
      .from(TableName.PriceFeed)
      .select("*", { count: "exact" })
      .then((res) => res.count ?? 0),
  ["cached-num-markets-with-daily-activity"],
  { revalidate: 30 }
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
      ? await fetchCachedNumMarketsWithDailyActivity().then(getMaxStatsPageNumber)
      : maxPageNumberFromRes;

  return (
    <>
      <StatsButtonsBlock
        numPages={maxPageNumber}
        page={page}
        sortBy={sortBy}
        desc={!orderBy.ascending}
        className="p-2 pb-4"
      />
      <StatsPageComponent page={page} sortBy={sortBy} orderBy={orderBy} data={data} />;
      <StatsButtonsBlock
        numPages={maxPageNumber}
        page={page}
        sortBy={sortBy}
        desc={!orderBy.ascending}
        className="pb-2"
      />
    </>
  );
}
