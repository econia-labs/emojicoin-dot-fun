import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { type NextRequest, NextResponse } from "next/server";

import { fetchMarketLatestCandlesticks } from "@/sdk/indexer-v2";

import { LatestCandlesticksSearchParamsSchema } from "./search-params-schema";

const cachedResponse = unstableCacheWrapper(
  fetchMarketLatestCandlesticks,
  ["fetch-market-latest-candlesticks"],
  {
    revalidate: 2,
    tags: ["fetch-market-latest-candlesticks"],
  }
);

export const GET = apiRouteErrorHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(searchParams.entries());
  const { marketID } = LatestCandlesticksSearchParamsSchema.parse(params);

  try {
    const latest = await cachedResponse(marketID);
    return NextResponse.json(latest);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
