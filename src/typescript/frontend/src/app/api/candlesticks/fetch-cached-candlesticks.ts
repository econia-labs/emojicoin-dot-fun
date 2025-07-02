import { unstable_cache } from "next/cache";
import { CACHE_ONE_YEAR } from "next/dist/lib/constants";

import { fetchCandlesticksInRange } from "@/queries/market";
import type { SupportedPeriod } from "@/sdk/const";
import type { ChunkMetadata } from "@/sdk/indexer-v2/queries/api/candlesticks";
import type { AnyNumberString } from "@/sdk/types/types";

const HISTORICAL_CACHE_REVALIDATION_TIME = CACHE_ONE_YEAR;
const INCOMPLETE_CACHE_REVALIDATION_TIME = 10;

const fetchHistoricalCandlestickData = unstable_cache(fetchCandlesticksInRange, [], {
  revalidate: HISTORICAL_CACHE_REVALIDATION_TIME,
  tags: ["fetch-historical-candlestick-data"],
});

const fetchIncompleteCandlestickData = unstable_cache(fetchCandlesticksInRange, [], {
  revalidate: INCOMPLETE_CACHE_REVALIDATION_TIME,
  tags: ["fetch-incomplete-candlestick-data"],
});

export async function fetchCachedChunkedCandlesticks(
  args: { marketID: AnyNumberString; period: SupportedPeriod } & ChunkMetadata
) {
  const { marketID, period, firstStartTime, lastStartTime, complete } = args;

  const fetchFunction = complete ? fetchHistoricalCandlestickData : fetchIncompleteCandlestickData;

  return await fetchFunction({
    marketID,
    period,
    firstStartTime,
    lastStartTime,
  });
}
