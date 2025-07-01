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
  const validatedParams = CandlesticksSearchParamsSchema.parse(paramsObject);
  const { marketID, period, countBack, to, chunkSize } = {
    ...validatedParams,
    chunkSize: CHUNK_SIZE,
  };
  try {
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
    const res: DatabaseJsonType["candlesticks"][] = [];
    // Since `to` is in seconds.
    const toAsDate = new Date(to * 1000);
    while (relevantChunks.length && res.length < countBack) {
      const nextChunkMetadata = relevantChunks.pop()!;
      const inner = await fetchCachedChunkedCandlesticks({
        marketID,
        period,
        ...nextChunkMetadata,
      });

      // Only include candlesticks less than the `to` param, since it's non-inclusive.
      const filtered = inner.filter((c) => new Date(c.start_time).getTime() < toAsDate.getTime());
      res.unshift(...filtered);
    }

    // Make sure `res` is exactly `countBack` items.
    while (res.length > countBack) {
      res.shift();
    }

    return NextResponse.json(res);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
