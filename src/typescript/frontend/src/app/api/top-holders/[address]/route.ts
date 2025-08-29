import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { fetchCachedTopHolders } from "lib/queries/aptos-indexer/fetch-top-holders";
import { type NextRequest, NextResponse } from "next/server";

import { AccountAddressSchema } from "@/sdk/utils/validation/account-address";

// This query can take a long time, especially on testnet. Limit the Vercel function duration
// to a shorter amount.
export const maxDuration = 5;
export const dynamic = "force-static";
export const revalidate = 60;
export const dynamicParams = true;

export const GET = apiRouteErrorHandler(
  async (_request: NextRequest, { params }: { params: { address: `0x${string}` } }) => {
    const accountAddress = AccountAddressSchema.parse(params.address);
    const topHolders = await fetchCachedTopHolders(accountAddress);
    return NextResponse.json(topHolders);
  }
);
