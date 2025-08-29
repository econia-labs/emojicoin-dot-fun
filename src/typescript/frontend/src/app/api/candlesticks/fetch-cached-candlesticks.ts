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
  "fetch-historical-candlestick-data",
  { revalidate: HISTORICAL_CACHE_REVALIDATION_TIME }
);

/**
 * Since there should only be a single entry for each market for the latest candlestick data, create
 * a stable (aka cacheable) callback function by capturing the first/last start time variables in
 * the closure returned.
 *
 * That is, this function is cacheable by marketID and period. The first/last start times will often
 * change, but the cache entry will always remain the same, making this a single stable entry for
 * each market's incomplete candlestick data.
 */
const stableFetchIncompleteCandlestickData = ({
  firstStartTime,
  lastStartTime,
}: Omit<CandlesticksQueryArgs, "marketID" | "period">) => {
  const stableIncompleteFetcher = async ({
    marketID,
    period,
  }: Omit<CandlesticksQueryArgs, "firstStartTime" | "lastStartTime">) => {
    return fetchCandlesticksInRange({ marketID, period, firstStartTime, lastStartTime });
  };

  return unstableCacheWrapper(stableIncompleteFetcher, "fetch-incomplete-candlestick-data", {
    revalidate: INCOMPLETE_CACHE_REVALIDATION_TIME,
  });
};

export async function fetchCachedChunkedCandlesticks(
  args: { marketID: AnyNumberString; period: z.infer<typeof SupportedPeriodSchema> } & ChunkMetadata
) {
  const { marketID, period, firstStartTime, lastStartTime, complete } = args;

  const fetchIncompleteCandlestickData = stableFetchIncompleteCandlestickData({
    firstStartTime,
    lastStartTime,
  });

  return complete
    ? await fetchHistoricalCandlestickData({ marketID, period, firstStartTime, lastStartTime })
    : await fetchIncompleteCandlestickData({ marketID, period });
}
