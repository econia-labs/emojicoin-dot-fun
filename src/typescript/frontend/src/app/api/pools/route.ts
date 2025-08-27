import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseSearchParams } from "utils/url-utils";

import { getPoolData } from "./getPoolDataQuery";
import { GetPoolsSchema } from "./schema";

const getCachedPoolData = unstableCacheWrapper(getPoolData, "pool-data", { revalidate: 5 });

export const GET = apiRouteErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = parseSearchParams(searchParams);
  const { page, sortBy, account, orderBy, searchBytes } = GetPoolsSchema.parse(params);

  let res: Awaited<ReturnType<typeof getPoolData>> = "[]";

  try {
    res = await getCachedPoolData({
      page,
      sortBy,
      orderBy,
      searchEmojis: searchBytes,
      provider: account,
    });
  } catch (e) {
    console.error(e);
  }
  return new NextResponse(res);
});
