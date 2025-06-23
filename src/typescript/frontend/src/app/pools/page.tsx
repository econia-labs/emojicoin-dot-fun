import generateMetadataHelper from "lib/utils/generate-metadata-helper";
import { emoji } from "utils";

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
export default async function PoolsPage() {
  return <ClientPoolsPage />;
}
