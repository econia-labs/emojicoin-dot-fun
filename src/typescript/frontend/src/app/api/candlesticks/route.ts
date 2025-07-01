import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import type { CandlestickModel } from "@/sdk/index";
import {
  fetchAllChunkedCandlesticksMetadata,
  getOnlyRelevantChunks,
  toChunkMetadata,
} from "@/sdk/indexer-v2/queries/api/candlesticks";

import { fetchCachedChunkedCandlesticks } from "./fetch-cached-candlesticks";
import { CandlesticksSearchParamsSchema } from "./search-params-schema";
import { getCandlesticksRoute } from "./utils";

const CHUNK_SIZE = 500;

const fetchCachedAllChunkedCandlestickMetadata = unstable_cache(
  fetchAllChunkedCandlesticksMetadata,
  [],
  {
    revalidate: 20,
    tags: ["fetch-all-chunked-candlesticks-metadata"],
  }
);

export const GET = apiRouteErrorHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const paramsObject = Object.fromEntries(searchParams.entries());
  const validatedParams = CandlesticksSearchParamsSchema.parse(paramsObject);

  const { marketID, period, countBack, to, chunkSize } = {
    ...validatedParams,
    chunkSize: CHUNK_SIZE,
  };

  const chunkMetadata = await fetchCachedAllChunkedCandlestickMetadata({
    marketID,
    period,
    chunkSize,
  }).then((res) => toChunkMetadata(res, chunkSize));

  const relevantChunks = getOnlyRelevantChunks({
    expectedChunkSize: chunkSize,
    chunkMetadata,
    toAndCountBack: { to, countBack },
  });

  // Now fetch each chunk one by one until `countBack` rows have been retrieved.
  const res: CandlestickModel[] = [];
  // Since `to` is in seconds.
  const toAsDate = new Date(to * 1000);
  while (relevantChunks.length && res.length < countBack) {
    const nextChunkMetadata = relevantChunks.pop()!;
    const inner = await fetchCachedChunkedCandlesticks({ marketID, period, ...nextChunkMetadata });
    // Only include candlesticks less than the `to` param, since it's non-inclusive.
    const filtered = inner.filter((c) => c.startTime.getTime() < toAsDate.getTime());
    res.unshift(...filtered);
  }

  // Make sure `res` is exactly `countBack` items.
  while (res.length > countBack) {
    res.shift();
  }

  // cpsell Remove this once done testing.
  //
  // const THE_TRUTH = await postgrest
  //   .from(TableName.PeriodicStateEvents)
  //   .select("*")
  //   .eq("market_id", marketID)
  //   .eq("period", period)
  //   .lt("start_time", toAsDate.toISOString())
  //   .order("start_time", ORDER_BY.DESC)
  //   .limit(329)
  //   .returns<DatabaseJsonType["periodic_state_events"][]>()
  //   .then((res) => res.data ?? []);
  // const theTruthTimes = THE_TRUTH.map((v) => (safeParseBigIntOrPostgresTimestamp(v.start_time).getTime())).sort().map((v) => new Date(v).toISOString());

  try {
    const data = await getCandlesticksRoute(validatedParams);
    return new NextResponse(data);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
