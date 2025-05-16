// Don't cache the page- just server render it.
// The data caching is done in the API route, not in the
// react rendered server component.

import fetchCachedPaginatedMarketStats from "app/api/stats/query";
import type { StatsSchemaInput } from "app/api/stats/schema";
import { createStatsSchema } from "app/api/stats/schema";
import { fetchCachedNumMarketsFromAptosNode } from "lib/queries/num-market";

export const revalidate = 0;
export const dynamic = "force-dynamic";

interface StatsPageParams {
  params?: {};
  searchParams?: StatsSchemaInput;
}

export default async function Stats({ searchParams }: StatsPageParams) {
  const res = await fetchCachedNumMarketsFromAptosNode()
    .then(async (numMarkets) => {
      const { data: validatedParams, success } =
        createStatsSchema(numMarkets).safeParse(searchParams);
      if (!success) {
        // Parsing failed, use default params.
        const defaultParams = createStatsSchema(numMarkets).parse({});
        return fetchCachedPaginatedMarketStats(defaultParams);
      }
      return fetchCachedPaginatedMarketStats(validatedParams);
    })
    .catch((e) => {
      console.error(e);
      return [];
    });

  console.log(res);

  return <></>;
}
