import ClientPoolsPage from "components/pages/pools/ClientPoolsPage";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";
import { getPoolData } from "./api/getPoolDataQuery";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { type Metadata } from "next";
import { emoji } from "utils";

export const revalidate = 1;
export const fetchCache = "default-cache";

export const metadata: Metadata = {
  title: "pools",
  description: `Provide ${emoji("water wave")}liquidity${emoji("water wave")} and earn APR using your emojis !`,
};

export default async function PoolsPage({ searchParams }: { searchParams: { pool: string } }) {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));
  const initialData = await getPoolData(
    1,
    SortMarketsBy.AllTimeVolume,
    "desc",
    searchParams.pool
      ? symbolBytesToEmojis(searchParams.pool).emojis.map((e) => e.emoji)
      : undefined
  );
  return <ClientPoolsPage geoblocked={geoblocked} initialData={initialData} />;
}
