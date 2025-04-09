import FEATURE_FLAGS from "lib/feature-flags";
import { waitForVersionCached } from "lib/queries/latest-emojicoin-version";
import { type NextRequest, NextResponse } from "next/server";

import type { DatabaseJsonType } from "@/sdk/index";
import { fetchArenaInfoJson, fetchSpecificMarketsUnsafe } from "@/sdk/indexer-v2/queries";
import { PositiveBigIntSchema } from "@/sdk/utils/validation/bigint";

export const fetchCache = "force-no-store";

export type ArenaInfoResponse = {
  arena_info: DatabaseJsonType["arena_info"];
  market_0: DatabaseJsonType["market_state"];
  market_1: DatabaseJsonType["market_state"];
};

export async function GET(request: NextRequest) {
  if (!FEATURE_FLAGS.Arena) {
    return new NextResponse("Arena isn't enabled.", { status: 503 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  const parsedMinimumVersion = PositiveBigIntSchema.safeParse(searchParams.minimumVersion);

  // If a minimum version is specified- wait for it.
  if (parsedMinimumVersion.success) {
    await waitForVersionCached(parsedMinimumVersion.data);
  }

  const arena_info = await fetchArenaInfoJson();

  if (!arena_info) {
    return new NextResponse("Couldn't find the current arena info.", { status: 404 });
  }

  // Not unsafe because there's only 2 symbols. It's only "unsafe" if there's lots of symbols.
  const { market_0, market_1 } = await fetchSpecificMarketsUnsafe([
    arena_info.emojicoin_0_symbols,
    arena_info.emojicoin_1_symbols,
  ]).then((res) => ({
    market_0: res.find((v) => v.market_id === arena_info.emojicoin_0_market_id),
    market_1: res.find((v) => v.market_id === arena_info.emojicoin_1_market_id),
  }));

  if (!market_0 || !market_1) {
    return new NextResponse("Couldn't find the market state data.", { status: 404 });
  }

  return NextResponse.json({ arena_info, market_0, market_1 });
}
