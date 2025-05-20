// Don't cache the page- just server render it.
// The data caching is done in the API route, not in the
// react rendered server component.

import fetchCachedFullMarketStatsQuery from "app/api/stats/full-query";
import type { StatsSchemaInput } from "app/api/stats/schema";

import { toPartialPriceFeed } from "@/sdk/index";

import { StatsButtonsBlock } from "./PaginationButtons";
import StatsPageComponent from "./StatsPage";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface StatsPageParams {
  params?: {};
  searchParams?: StatsSchemaInput;
}

export default async function Stats({ searchParams }: StatsPageParams) {
  const params = searchParams ?? {};
  const res = await fetchCachedFullMarketStatsQuery(params).then(({ data, ...rest }) => ({
    ...rest,
    data: data.map(toPartialPriceFeed),
  }));
  const { maxPageNumber, page, sortBy, orderBy, data } = res;

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
