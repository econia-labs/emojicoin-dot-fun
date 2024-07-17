import { toOrderBy } from "@sdk/queries/const";
import fetchSortedMarketData from "lib/queries/sorting/market-data";
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
    sortByStr !== "all_time_vol"
  ) {
    throw "Invalid params";
  } else {
    sortBy = sortByStr as SortByPostgrestQueryParams;
  }
  const searchBytes = searchParams.get("q") ?? undefined;
  const data = await fetchSortedMarketData({
    page,
    inBondingCurve: null,
    orderBy: toOrderBy("desc"),
    sortBy,
    searchBytes,
    exactCount: true,
  });
  return new Response(stringifyJSON(data));
}
