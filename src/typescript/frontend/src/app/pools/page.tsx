import ClientPoolsPage, { type PoolsData } from "components/pages/pools/ClientPoolsPage";
import { getPoolData } from "./api/getPoolDataQuery";
import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { type Metadata } from "next";
import { emoji, parseJSON } from "utils";
import { getValidSortByForPoolsPage } from "@sdk/indexer-v2/queries/query-params";
import { safeParsePageWithDefault, handleEmptySearchBytes } from "lib/routes/home-page-params";

export const revalidate = 2;

export const metadata: Metadata = {
  title: "pools",
  description: `Provide ${emoji("water wave")}liquidity${emoji("water wave")} and earn APR using your emojis !`,
};

type PoolsSearchParams = {
  page: string | null;
  sortby: string | null;
  orderby: string | null;
  searchBytes: string | null;
  pool: string | null;
  account: string | null;
};

export default async function PoolsPage({ searchParams }: { searchParams: PoolsSearchParams }) {
  const page = safeParsePageWithDefault(searchParams.page);
  const sortBy = getValidSortByForPoolsPage(searchParams.sortby);
  const orderBy = searchParams.orderby ?? "desc";
  const q = handleEmptySearchBytes(searchParams.searchBytes);
  const searchEmojis = q ? symbolBytesToEmojis(q).emojis.map((e) => e.emoji) : undefined;

  if (orderBy !== "asc" && orderBy !== "desc") {
    throw new Error("Invalid params");
  }

  // The liquidity `provider`, aka the account to search for in the user liquidity pools.
  const provider = searchParams.account;

  const initialData: PoolsData[] = parseJSON(
    await getPoolData(page, sortBy, orderBy, searchEmojis, provider ?? undefined)
  );

  return <ClientPoolsPage initialData={initialData} />;
}
