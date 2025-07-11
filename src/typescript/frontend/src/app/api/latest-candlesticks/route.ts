import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { unstable_cache } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";

import { fetchMarketLatestCandlesticks } from "@/sdk/indexer-v2";

import { LatestCandlesticksSearchParamsSchema } from "./search-params-schema";

export const fetchCache = "force-no-store";
export const revalidate = 0;

const cachedResponse = unstable_cache(fetchMarketLatestCandlesticks, [], {
  revalidate: 2,
  tags: ["fetch-market-latest-candlesticks"],
});

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
