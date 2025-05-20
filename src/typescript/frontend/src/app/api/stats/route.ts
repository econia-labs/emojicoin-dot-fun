import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseSearchParams } from "utils/url-utils";

import fetchCachedFullMarketStatsQuery from "./full-query";

export const fetchCache = "force-no-store";
export const revalidate = 0;

/**
 * @param page - the pagination page number
 * @param sortBy - the column to sort by, see {@link createStatsSchema} for more info
 * @param orderBy - "asc" or "desc", the order of the sorted column
 */
export const GET = apiRouteErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = parseSearchParams(searchParams);
  const { data } = await fetchCachedFullMarketStatsQuery(params);
  return NextResponse.json(data, { status: 200 });
});
