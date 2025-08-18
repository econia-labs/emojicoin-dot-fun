import { type NextRequest, NextResponse } from "next/server";

import { fetchPriceFeedWithMarketState } from "@/queries/home";
import { ORDER_BY } from "@/sdk/indexer-v2/const";
import { SortMarketsBy } from "@/sdk/indexer-v2/types";

export const revalidate = 10;
export const dynamic = "error";

export const NUM_MARKETS_ON_PRICE_FEED = 25;

export async function GET(_request: NextRequest) {
  const res = await fetchPriceFeedWithMarketState({
    sortBy: SortMarketsBy.DailyVolume,
    orderBy: ORDER_BY.DESC,
    pageSize: NUM_MARKETS_ON_PRICE_FEED,
  });

  return NextResponse.json(res);
}
