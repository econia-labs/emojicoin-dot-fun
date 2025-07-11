import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import FEATURE_FLAGS from "lib/feature-flags";
import { type NextRequest, NextResponse } from "next/server";

import fetchCachedArenaCandlesticks from "./fetch-cached-arena-candlesticks";
import { ArenaCandlesticksSearchParamsSchema } from "./search-params-schema";

export const fetchCache = "force-no-store";
export const revalidate = 0;

export const GET = apiRouteErrorHandler(async (request: NextRequest) => {
  if (!FEATURE_FLAGS.Arena) {
    return new NextResponse("Arena isn't enabled.", { status: 503 });
  }

  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(searchParams.entries());
  const validatedParams = ArenaCandlesticksSearchParamsSchema.parse(params);

  try {
    const { meleeID, period, to, countBack } = validatedParams;
    const allArenaCandlesticksForPeriod = await fetchCachedArenaCandlesticks({ meleeID, period });

    // Filter all candlesticks that occur at or after `to`; note `to` is in seconds.
    const toAsDate = new Date(to * 1000);
    const filtered = allArenaCandlesticksForPeriod.filter(
      (c) => new Date(c.start_time).getTime() >= toAsDate.getTime()
    );

    // Make sure the response is exactly `countBack` items.
    const candlesticks = filtered.slice(-countBack);

    return NextResponse.json(candlesticks);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
