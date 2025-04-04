import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { unstable_cache } from "next/cache";
import { parseSearchParams } from "utils/url-utils";

import { getPoolData } from "./getPoolDataQuery";
import { GetPoolsSchema } from "./schema";

const getCachedPoolData = unstable_cache(getPoolData, ["pool-data"], { revalidate: 5 });

export const GET = apiRouteErrorHandler(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const params = parseSearchParams(searchParams);
  const { page, sortBy, account, orderBy, searchBytes } = GetPoolsSchema.parse(params);

  let res: Awaited<ReturnType<typeof getPoolData>> = "[]";

  try {
    res = await getCachedPoolData(page, sortBy, orderBy, searchBytes, account);
  } catch (e) {
    console.error(e);
  }
  return new Response(res);
});
