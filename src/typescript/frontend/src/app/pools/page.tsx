import ClientPoolsPage, { type PoolsData } from "components/pages/pools/ClientPoolsPage";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";
import { getPoolData } from "./api/getPoolDataQuery";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { type Metadata } from "next";
import { emoji, parseJSON } from "utils";
import { logFetch } from "lib/logging";

export const revalidate = 2;

export const metadata: Metadata = {
  title: "pools",
  description: `Provide ${emoji("water wave")}liquidity${emoji("water wave")} and earn APR using your emojis !`,
};

export default async function PoolsPage({ searchParams }: { searchParams: { pool: string } }) {
  const args = {
    page: 1,
    sortBy: SortMarketsBy.AllTimeVolume,
    orderBy: "desc" as const,
    searchEmojis: searchParams.pool
      ? symbolBytesToEmojis(searchParams.pool).emojis.map((e) => e.emoji)
      : undefined,
  };
  const poolData = await logFetch(
    async () => getPoolData(args.page, args.sortBy, args.orderBy, args.searchEmojis),
    args
  );
  const initialData: PoolsData[] = parseJSON(poolData);

  // Call this last because `headers()` is a dynamic API and all fetches after this aren't cached.
  const geoblocked = await logFetch(isUserGeoblocked, { ip: headers().get("x-real-ip") });
  return <ClientPoolsPage geoblocked={geoblocked} initialData={initialData} />;
}
