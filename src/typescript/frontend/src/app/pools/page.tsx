import ClientPoolsPage from "components/pages/pools/ClientPoolsPage";
import { REVALIDATION_TIME } from "lib/server-env";
import { headers } from "next/headers";
import { isUserGeoblocked } from "utils/geolocation";
import { getPoolData } from "./api/getPoolDataQuery";
import { SortMarketsBy } from "@sdk/indexer-v2/types/common";
import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import type { QueryType } from "utils";
import { ROUTES } from "router/routes";
import { redirect } from "next/navigation";

export const revalidate = REVALIDATION_TIME;
export const dynamic = "force-dynamic";

export default async function PoolsPage({ searchParams }: { searchParams: { pool: string } }) {
  const geoblocked = await isUserGeoblocked(headers().get("x-real-ip"));

  let initialData: QueryType<typeof getPoolData>;

  try {
    initialData = await getPoolData(
      1,
      SortMarketsBy.AllTimeVolume,
      "desc",
      searchParams.pool
        ? symbolBytesToEmojis(searchParams.pool).emojis.map((e) => e.emoji)
        : undefined
    );
  } catch (e) {
    console.error(e);
    redirect(ROUTES.maintenance);
  }

  return <ClientPoolsPage geoblocked={geoblocked} initialData={initialData} />;
}
