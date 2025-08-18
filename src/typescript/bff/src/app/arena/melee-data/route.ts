
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchArenaInfoJson } from "@/queries/arena";
import { toArenaInfoModel, toMarketStateModel } from "@/sdk/indexer-v2";
import { calculateExchangeRateDelta } from "@/sdk/markets/utils";

import { fetchCachedExchangeRatesWithErrorHandling, fetchMeleeData } from "./fetches";

export const revalidate = 10;
export const dynamic = "error";

const logAndDefault = (e: unknown) => {
  console.error(e);
  return {
    arenaInfo: null,
    market0: null,
    market1: null,
    rewardsRemaining: null,
    market0Delta: null,
    market1Delta: null,
  };
};

export async function GET(_request: NextRequest) {
  const arena_info = await fetchArenaInfoJson();
  if (!arena_info) return logAndDefault("Couldn't fetch arena info.");

  const [melee, { market_0_rate, market_1_rate }] = await Promise.all([
    fetchMeleeData({ arena_info }),
    fetchCachedExchangeRatesWithErrorHandling(arena_info),
  ]);

  const res = {
    arenaInfo: toArenaInfoModel(melee.arena_info),
    market0: toMarketStateModel(melee.market_0),
    market1: toMarketStateModel(melee.market_1),
    rewardsRemaining: BigInt(melee.rewards_remaining),
    market0Delta: market_0_rate ? calculateExchangeRateDelta(market_0_rate, melee.market_0) : null,
    market1Delta: market_1_rate ? calculateExchangeRateDelta(market_1_rate, melee.market_1) : null,
  };

  return NextResponse.json(res);
}
