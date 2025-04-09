import FEATURE_FLAGS from "lib/feature-flags";
import { waitForVersionCached } from "lib/queries/latest-emojicoin-version";
import { type NextRequest, NextResponse } from "next/server";

import { fetchArenaInfoJson } from "@/sdk/indexer-v2/queries";
import { PositiveBigIntSchema } from "@/sdk/utils/validation/bigint";

export const fetchCache = "force-no-store";

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

  const arenaInfo = await fetchArenaInfoJson();

  if (!arenaInfo) {
    return new NextResponse("Couldn't find the current arena info.", {
      status: 404,
    });
  }

  return NextResponse.json(arenaInfo);
}
