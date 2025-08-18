import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { fetchArenaInfoJson } from "@/queries/arena";

import { fetchCachedExchangeRatesWithErrorHandling, fetchMeleeData } from "./fetches";

export const revalidate = 10;
export const dynamic = "error";

const logAndDefault = (e: unknown) => {
  console.error(e);
  return NextResponse.json({
    arena_info: null,
    market_0: null,
    market_1: null,
    rewards_remaining: null,
    market_0_delta: null,
    market_1_delta: null,
  });
};

export async function GET(_request: NextRequest) {
  const arena_info = await fetchArenaInfoJson();
  if (!arena_info) return logAndDefault("Couldn't fetch arena info.");

  const [{ rewards_remaining, market_0, market_1 }, { market_0_rate, market_1_rate }] =
    await Promise.all([
      fetchMeleeData({ arena_info }),
      fetchCachedExchangeRatesWithErrorHandling(arena_info),
    ]);

  const res = {
    arena_info,
    market_0,
    market_1,
    rewards_remaining,
    market_0_rate,
    market_1_rate,
  };

  return NextResponse.json(res);
}
