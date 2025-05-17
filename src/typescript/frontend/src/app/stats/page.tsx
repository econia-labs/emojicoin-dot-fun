// Don't cache the page- just server render it.
// The data caching is done in the API route, not in the
// react rendered server component.

import fetchCachedPaginatedMarketStats from "app/api/stats/query";
import type { StatsSchemaInput } from "app/api/stats/schema";
import { createStatsSchema } from "app/api/stats/schema";
import { fetchCachedNumMarketsFromAptosNode } from "lib/queries/num-market";

import type { PartialPriceFeedModel } from "@/sdk/index";
import { toPartialPriceFeed } from "@/sdk/index";

import StatsPageComponent from "./StatsPage";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export interface StatsPageParams {
  params?: {};
  searchParams?: StatsSchemaInput;
}

const getDefaultParams = (numMarkets: number) => createStatsSchema(numMarkets).parse({});

export default async function Stats({ searchParams }: StatsPageParams) {
  const { finalParams, data } = await fetchCachedNumMarketsFromAptosNode()
    .then(async (numMarkets) => {
      const { data: validatedParams, success } =
        createStatsSchema(numMarkets).safeParse(searchParams);
      const finalParams = success ? validatedParams : getDefaultParams(numMarkets);
      return fetchCachedPaginatedMarketStats(finalParams).then((data) => ({
        finalParams,
        data: data.map(toPartialPriceFeed),
      }));
    })
    .catch((e) => {
      console.error(e);
      return {
        finalParams: getDefaultParams(1),
        data: [] as PartialPriceFeedModel[],
      };
    });

  return <StatsPageComponent params={finalParams} data={data} />;
}
