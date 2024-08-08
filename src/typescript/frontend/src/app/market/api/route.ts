import fetchSortedMarketData from "lib/queries/sorting/market-data";
import { stringifyJSON } from "utils";
import { constructHomePageSearchParams } from "lib/queries/sorting/query-params";
import { toHomePageParamsWithDefault } from "lib/routes/home-page-params";

export const dynamic = "force-dynamic";

// Returns market data for a given market. Note that this only
// supports the search params for a home page request.
export async function GET(request: Request) {
  const { searchParams: urlSearchParams } = new URL(request.url);
  const searchParams = constructHomePageSearchParams(urlSearchParams);
  const {
    page,
    sortBy,
    orderBy,
    inBondingCurve,
    q: searchBytes,
  } = toHomePageParamsWithDefault(searchParams);

  const data = await fetchSortedMarketData({
    page,
    orderBy,
    sortBy,
    inBondingCurve,
    searchBytes,
    exactCount: true,
  });
  return new Response(stringifyJSON(data));
}
