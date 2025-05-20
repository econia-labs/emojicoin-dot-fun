import { fetchCachedNumMarketsFromAptosNode } from "lib/queries/num-market";

import type { PartialPriceFeedJson } from "@/sdk/index";

import type { StatsSchemaInput, StatsSchemaOutput } from "./schema";
import { createStatsSchema, getMaxStatsPageNumber } from "./schema";
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
  data: PartialPriceFeedJson[];
}> {
  return await fetchCachedNumMarketsFromAptosNode()
    .then(async (numMarkets) => {
      const { data: validatedParams, success } =
        createStatsSchema(numMarkets).safeParse(searchParams);
      const finalParams = success ? validatedParams : getDefaultParams(numMarkets);
      return fetchCachedPaginatedMarketStats(finalParams).then((data) => ({
        maxPageNumber: getMaxStatsPageNumber(numMarkets),
        data,
        ...finalParams,
      }));
    })
    .catch((e) => {
      console.error(e);
      return {
        maxPageNumber: 1,
        data: [] as PartialPriceFeedJson[],
        ...getDefaultParams(1),
      };
    });
}
