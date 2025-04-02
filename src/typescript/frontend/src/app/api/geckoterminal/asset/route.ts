import { asset, type AssetResponse } from "lib/dexscreener";
import type { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest): Promise<NextResponse<AssetResponse>> {
  return asset(request, { withDecimals: true });
}
