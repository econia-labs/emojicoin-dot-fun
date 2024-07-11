import { toOrderBy } from "@sdk/queries/const";
import fetchSortedMarketData, { fetchMyPools } from "lib/queries/sorting/market-data";
import type { SortByPostgrestQueryParams } from "lib/queries/sorting/types";
import { stringifyJSON } from "utils";

export const dynamic = "force-dynamic";

// Returns market data
// Defaults to page 0, sort by market cap desc.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageStr = searchParams.get("page") ?? "1";
  let page: number;
  try {
    page = Number.parseInt(pageStr);
  } catch {
    throw "Invalid params";
  }
  const sortByStr = searchParams.get("sortby") ?? "market_cap";
  let sortBy: SortByPostgrestQueryParams;
  if (
    sortByStr !== "market_cap" &&
    sortByStr !== "bump" &&
    sortByStr !== "daily_vol" &&
    sortByStr !== "all_time_vol" &&
    sortByStr !== "price" &&
    sortByStr !== "apr" &&
    sortByStr !== "tvl"
  ) {
    throw "Invalid params";
  } else {
    sortBy = sortByStr as SortByPostgrestQueryParams;
  }
  const orderBy = searchParams.get("orderby") ?? "desc";
  if (orderBy !== "asc" && orderBy !== "desc") {
    throw "Invalid params";
  }
  const searchBytes = searchParams.get("searchBytes") ?? undefined;
  const account = searchParams.get("account");
  if (account) {
    const data = await fetchMyPools({
      page,
      orderBy: toOrderBy(orderBy),
      sortBy,
      account,
      searchBytes,
    });
    return new Response(stringifyJSON(data));
  } else {
    const data = await fetchSortedMarketData({
      page,
      inBondingCurve: false,
      orderBy: toOrderBy(orderBy),
      sortBy,
      searchBytes,
    });
    return new Response(stringifyJSON(data));
  }
}
