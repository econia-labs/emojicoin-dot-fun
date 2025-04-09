import { AccountAddress } from "@aptos-labs/ts-sdk";
import { fetchCachedMeleeData } from "app/home/fetch-melee-data";
import FEATURE_FLAGS from "lib/feature-flags";
import { waitForVersionCached } from "lib/queries/latest-emojicoin-version";
import { type NextRequest, NextResponse } from "next/server";

import { fetchPositionWithArenaInfo } from "@/sdk/indexer-v2/queries/api/user-position/query";
import type { UserPositionResponse } from "@/sdk/indexer-v2/queries/api/user-position/types";
import { PositiveBigIntSchema } from "@/sdk/utils/validation/bigint";

export const fetchCache = "force-no-store";

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  if (!FEATURE_FLAGS.Arena) {
    return new NextResponse("Arena isn't enabled.", { status: 503 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  const { user } = await params;
  const parsedMinimumVersion = PositiveBigIntSchema.safeParse(searchParams.minimumVersion);

  // If a minimum version is specified- wait for it.
  if (parsedMinimumVersion.success) {
    await waitForVersionCached(parsedMinimumVersion.data);
  }

  if (!!user && !AccountAddress.isValid({ input: user, strict: true }).valid) {
    return new NextResponse("Invalid address.", { status: 400 });
  }

  const { arenaInfo, market0, market1 } = await fetchCachedMeleeData();

  if (!arenaInfo || !market0 || !market1) {
    return new NextResponse("Couldn't fetch current melee data in user position route.", {
      status: 424,
    });
  }

  const positionWithArenaInfo = await fetchPositionWithArenaInfo({
    user: user as `0x${string}`,
    arenaInfo,
  });

  return NextResponse.json<UserPositionResponse>(positionWithArenaInfo);
}
