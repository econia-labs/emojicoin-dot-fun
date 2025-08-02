import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { CACHE_ONE_YEAR } from "next/dist/lib/constants";
import type { z } from "zod";

import { fetchCandlesticksInRange } from "@/queries/market";
import type { ChunkMetadata } from "@/sdk/indexer-v2/queries/api/candlesticks";
import type { CandlesticksQueryArgs } from "@/sdk/indexer-v2/types/common";
import type { AnyNumberString } from "@/sdk/types/types";

import type { SupportedPeriodSchema } from "./supported-period-schema";

const HISTORICAL_CACHE_REVALIDATION_TIME = CACHE_ONE_YEAR;
const INCOMPLETE_CACHE_REVALIDATION_TIME = 10;

const fetchHistoricalCandlestickData = unstableCacheWrapper(
  fetchCandlesticksInRange,
  ["fetch-historical-candlestick-data"],
  {
    revalidate: HISTORICAL_CACHE_REVALIDATION_TIME,
    tags: ["fetch-historical-candlestick-data"],
  }
);

/**
 * `unstable_cache` works by using the callback function's `cb.toString()` value as part of the
 * cache key. In order to ensure a hit despite varying input args, create the callback function
 * on the fly but ensure that `cb.toString()` is always constant by using a reference to the arg.
 * This is achieved through currying the function.
 */
const stableFetchIncompleteCandlestickData = ({
  marketID,
  period,
  firstStartTime,
  lastStartTime,
}: CandlesticksQueryArgs) => {
  const stableIncompleteFetcher = async ({
    marketID,
    period,
  }: Omit<CandlesticksQueryArgs, "firstStartTime" | "lastStartTime">) => {
    return fetchCandlesticksInRange({ marketID, period, firstStartTime, lastStartTime });
  };

  return unstableCacheWrapper(stableIncompleteFetcher, ["fetch-incomplete-candlestick-data"], {
    revalidate: INCOMPLETE_CACHE_REVALIDATION_TIME,
    tags: ["fetch-incomplete-candlestick-data", `market_${marketID}-${period}`],
  });
};

export async function fetchCachedChunkedCandlesticks(
  args: { marketID: AnyNumberString; period: z.infer<typeof SupportedPeriodSchema> } & ChunkMetadata
) {
  const { marketID, period, firstStartTime, lastStartTime, complete } = args;

  const fetchIncompleteCandlestickData = stableFetchIncompleteCandlestickData({
    marketID,
    period,
    firstStartTime,
    lastStartTime,
  });

  return complete
    ? await fetchHistoricalCandlestickData({ marketID, period, firstStartTime, lastStartTime })
    : await fetchIncompleteCandlestickData({ marketID, period });
}
