import type { NextRequest } from "next/server";

import { ROUTE_FETCHERS } from "../dynamic-fetcher";

export const revalidate = 10;
export const dynamic = "error";

export async function GET(_request: NextRequest) {
  return ROUTE_FETCHERS["price-feed"]();
}
