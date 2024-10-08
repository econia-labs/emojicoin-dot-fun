import { fetchMarkets } from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { getValidSortByForPoolsPage } from "@sdk/indexer-v2/queries/query-params";
import { toOrderBy } from "@sdk/queries/const";
import { handleEmptySearchBytes, safeParsePageWithDefault } from "lib/routes/home-page-params";
import { stringifyJSON } from "utils";
import { fetchUserLiquidityPools } from "@sdk/indexer-v2/queries/app/pools";
import { MARKETS_PER_PAGE } from "lib/queries/sorting/const";
import { REVALIDATION_TIME } from "lib/server-env";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export async function getPoolData(page: number, sortBy: SortMarketsBy, orderBy: "asc" | "desc", searchEmojis?: string[], provider?: string) {
  if (provider) {
    return fetchUserLiquidityPools({
      page,
      orderBy: toOrderBy(orderBy),
      sortBy,
      provider,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
    });
  } else {
    return fetchMarkets({
      page,
      inBondingCurve: false,
      orderBy: toOrderBy(orderBy),
      sortBy,
      searchEmojis,
      pageSize: MARKETS_PER_PAGE,
    });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = safeParsePageWithDefault(searchParams.get("page"));
  const sortBy = getValidSortByForPoolsPage(searchParams.get("sortby"));
  const orderBy = searchParams.get("orderby") ?? "desc";
  const q = handleEmptySearchBytes(searchParams.get("searchBytes"));
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  if (orderBy !== "asc" && orderBy !== "desc") {
    throw new Error("Invalid params");
  }

  // The liquidity `provider`, aka the account to search for in the user liquidity pools.
  const provider = searchParams.get("account");

  const data = await getPoolData(page, sortBy, orderBy, searchEmojis, provider ?? undefined);
  return new Response(stringifyJSON(data));
}
