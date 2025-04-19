import { getPoolData } from "app/api/pools/getPoolDataQuery";
import { GetPoolsSchema } from "app/api/pools/schema";
import generateMetadataHelper from "lib/utils/generate-metadata-helper";
import { emoji, parseJSON } from "utils";
import type { z } from "zod";

import ClientPoolsPage from "@/components/pages/pools/ClientPoolsPage";
import type { MarketStateModel, UserPoolsRPCModel } from "@/sdk/index";

export const revalidate = 2;

export const metadata = generateMetadataHelper({
  title: "pools",
  description: `provide ${emoji("water wave")}liquidity${emoji("water wave")} and earn APR using your emojis!`,
});

export type PoolsData = MarketStateModel | UserPoolsRPCModel;

/**
 * Uses the same exact parsing logic as the /pools/api route.
 * @see {@link src/pools/api/route.ts}
 */
export default async function PoolsPage({
  searchParams,
}: {
  searchParams: z.input<typeof GetPoolsSchema>;
}) {
  const { orderBy, page, sortBy, account, searchBytes } = GetPoolsSchema.parse(searchParams);

  const initialData: PoolsData[] = parseJSON(
    await getPoolData(page, sortBy, orderBy, searchBytes, account)
  );

  return <ClientPoolsPage initialData={initialData} />;
}
