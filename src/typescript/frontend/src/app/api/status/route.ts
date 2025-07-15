import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  fetchCachedAptosProcessorStatus,
  fetchCachedEmojicoinProcessorStatus,
  fetchCachedFullnodeRestApiHealth,
} from "./cached-fetches";

export const revalidate = 2;

export const GET = apiRouteErrorHandler(async (_req: NextRequest) => {
  const [emojicoinProcessorStatus, aptosProcessorStatus, fullnodeRestApiHealth] = await Promise.all(
    [
      fetchCachedEmojicoinProcessorStatus(),
      fetchCachedAptosProcessorStatus(),
      fetchCachedFullnodeRestApiHealth(),
    ]
  );

  return NextResponse.json({
    emojicoin_processor: {
      ...emojicoinProcessorStatus,
    },
    aptos_processor: {
      ...aptosProcessorStatus,
    },
    fullnode: {
      ...fullnodeRestApiHealth,
    },
  });
});
