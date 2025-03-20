import type { NextRequest, NextResponse } from "next/server";
import { latestBlock, type LatestBlockResponse } from "lib/dexscreener";

export const revalidate = 1;

export async function GET(request: NextRequest): Promise<NextResponse<LatestBlockResponse>> {
  return latestBlock(request);
}
