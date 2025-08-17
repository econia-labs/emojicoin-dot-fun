import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import FEATURE_FLAGS from "lib/feature-flags";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import { type NextRequest, NextResponse } from "next/server";

import { fetchArenaLatestCandlesticks } from "@/sdk/indexer-v2";

import { LatestArenaCandlesticksSearchParamsSchema } from "./search-params-schema";

const cachedResponse = unstableCacheWrapper(
  fetchArenaLatestCandlesticks,
  ["fetch-arena-latest-candlesticks"],
  {
    revalidate: 2,
    tags: ["fetch-arena-latest-candlesticks"],
  }
);

export const GET = apiRouteErrorHandler(async (request: NextRequest) => {
  if (!FEATURE_FLAGS.Arena) {
    return new NextResponse("Arena isn't enabled.", { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(searchParams.entries());
  const { meleeID } = LatestArenaCandlesticksSearchParamsSchema.parse(params);

  try {
    const latest = await cachedResponse(meleeID);
    return NextResponse.json(latest);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
