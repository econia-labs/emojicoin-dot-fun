import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import type { DatabaseJsonType } from "@/sdk/index";
import {
  fetchAllChunkedCandlesticksMetadata,
  getOnlyRelevantChunks,
  toChunkMetadata,
} from "@/sdk/indexer-v2/queries/api/candlesticks";

import { fetchCachedChunkedCandlesticks } from "./fetch-cached-candlesticks";
import { CandlesticksSearchParamsSchema } from "./search-params-schema";

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
  const { marketID, period, countBack, to } = CandlesticksSearchParamsSchema.parse(paramsObject);
  try {
    const chunkMetadata = await fetchCachedAllChunkedCandlestickMetadata({
      marketID,
      period,
      chunkSize: CHUNK_SIZE,
    }).then((res) => toChunkMetadata(res, CHUNK_SIZE));

    const relevantChunks = getOnlyRelevantChunks({
      expectedChunkSize: CHUNK_SIZE,
      chunkMetadata,
      toAndCountBack: { to, countBack },
    });

    // Now fetch each chunk one by one until `countBack` rows have been retrieved.
    const candlesticks: DatabaseJsonType["candlesticks"][] = [];
    // Since `to` is in seconds.
    const toAsDate = new Date(to * 1000);
    while (relevantChunks.length && candlesticks.length < countBack) {
      const nextChunkMetadata = relevantChunks.pop()!;
      const inner = await fetchCachedChunkedCandlesticks({
        marketID,
        period,
        ...nextChunkMetadata,
      });

      // Only include candlesticks less than the `to` param, since it's non-inclusive.
      const filtered = inner.filter((c) => new Date(c.start_time).getTime() < toAsDate.getTime());
      // `unshift` because it's in ascending order.
      candlesticks.unshift(...filtered);
    }

    // Return exactly `countBack` items. Use a negative index because the start time is ascending.
    const res = candlesticks.slice(-countBack);

    return NextResponse.json(res);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
