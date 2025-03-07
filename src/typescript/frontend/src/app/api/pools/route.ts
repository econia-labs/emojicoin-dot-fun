import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { getValidSortByForPoolsPage } from "@sdk/indexer-v2/queries/query-params";
import { handleEmptySearchBytes, safeParsePageWithDefault } from "lib/routes/home-page-params";
import { getPoolData } from "./getPoolDataQuery";
import { unstable_cache } from "next/cache";

const getCachedPoolData = unstable_cache(getPoolData, ["pool-data"], { revalidate: 5 });

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

  let res: Awaited<ReturnType<typeof getPoolData>> = "[]";

  try {
    res = await getCachedPoolData(page, sortBy, orderBy, searchEmojis, provider ?? undefined);
  } catch (e) {
    console.error(e);
  }
  return new Response(res);
}
