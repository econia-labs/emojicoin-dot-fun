import { events, type EventsResponse } from "lib/dexscreener";
import type { NextRequest, NextResponse } from "next/server";

export const revalidate = 0;
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/**
 * We treat our versions as "blocks" because it's faster to implement given our current architecture
 * This requires dexscreener to have relatively large `fromBlock - toBlock` ranges to keep up
 * */
export async function GET(request: NextRequest): Promise<NextResponse<EventsResponse>> {
  return events(request);
}
