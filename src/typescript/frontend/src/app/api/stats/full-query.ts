import { fetchCachedNumRegisteredMarkets } from "lib/queries/num-market";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import type { DatabaseJsonType } from "@/sdk/index";

import type { StatsSchemaInput, StatsSchemaOutput } from "./schema";
import { createStatsSchema, STATS_MARKETS_PER_PAGE } from "./schema";
import fetchCachedPaginatedMarketStats from "./stats-query";

const getDefaultParams = (numMarkets: number) => createStatsSchema(numMarkets).parse({});

/**
 * The full query for the stats page fetches, including the precursory number of markets query
 * to pass to the search params validation function.
 *
 * It performs error handling and search params validation with default fallbacks in case of errors.
 */
export default async function fetchCachedFullMarketStatsQuery(
  searchParams: StatsSchemaInput
): Promise<{
  page: StatsSchemaOutput["page"];
  sortBy: StatsSchemaOutput["sortBy"];
  orderBy: StatsSchemaOutput["orderBy"];
  maxPageNumber: number;
  data: DatabaseJsonType["price_feed_with_nulls"][];
}> {
  return await fetchCachedNumRegisteredMarkets()
    .then(async (totalNumMarkets) => {
      const { data: validatedParams, success } =
        createStatsSchema(totalNumMarkets).safeParse(searchParams);
      const finalParams = success ? validatedParams : getDefaultParams(totalNumMarkets);
      return fetchCachedPaginatedMarketStats(finalParams).then((data) => ({
        maxPageNumber: getMaxPageNumber(totalNumMarkets, STATS_MARKETS_PER_PAGE),
        data,
        ...finalParams,
      }));
    })
    .catch((e) => {
      console.error(e);
      return {
        maxPageNumber: 1,
        data: [] as DatabaseJsonType["price_feed_with_nulls"][],
        ...getDefaultParams(1),
      };
    });
}
