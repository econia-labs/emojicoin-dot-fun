import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { fetchCachedNumMarketsFromAptosNode } from "lib/queries/num-market";
import { unstable_cache } from "next/cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseSearchParams } from "utils/url-utils";

import { fetchMarketsBy } from "./query";
import { createStatsSchema } from "./schema";

export const fetchCache = "force-no-store";
export const revalidate = 0;

const fetchCachedPaginatedMarketStats = unstable_cache(fetchMarketsBy, ["stats-markets"], {
  revalidate: 10,
});

/**
 * @param page - the pagination page number
 * @param sortBy - the column to sort by, see {@link createStatsSchema} for more info
 * @param orderBy - "asc" or "desc", the order of the sorted column
 */
export const GET = apiRouteErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = parseSearchParams(searchParams);
  return await fetchCachedNumMarketsFromAptosNode()
    .then(async (numMarkets) => {
      const statsParams = createStatsSchema(numMarkets).parse(params);
      console.log(statsParams);
      return fetchCachedPaginatedMarketStats(statsParams).then((res) => {
        console.log(res);
        return NextResponse.json(res, { status: 200 })
      }
      );
    })
    .catch((e) => {
      console.error(e);
      return new NextResponse((e as Error).message, { status: 400 });
    });
});
