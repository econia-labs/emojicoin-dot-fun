import { ROUTE_FETCHERS } from "app/internal/dynamic-fetcher";
import type { NextRequest } from "next/server";

export const revalidate = 10;
export const dynamic = "error";

export async function GET(_request: NextRequest) {
  return ROUTE_FETCHERS["arena/melee-data"]();
}
