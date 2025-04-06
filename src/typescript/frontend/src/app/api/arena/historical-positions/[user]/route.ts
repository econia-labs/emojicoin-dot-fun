import { AccountAddress } from "@aptos-labs/ts-sdk";
import FEATURE_FLAGS from "lib/feature-flags";
import { waitForVersionCached } from "lib/queries/latest-emojicoin-version";
import { type NextRequest, NextResponse } from "next/server";

import { fetchArenaLeaderboardHistoryWithArenaInfoJson } from "@/queries/arena";
import { PositiveBigIntSchema } from "@/sdk/utils/validation/bigint";

const ROWS_RETURNED = 100;

export const fetchCache = "force-no-store";

// NOTE: This just returns the first 100 historical escrows + the current escrow.
// Past that, it would require custom pagination.
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

  const positions = await fetchArenaLeaderboardHistoryWithArenaInfoJson({
    user,
    page: 1,
    pageSize: ROWS_RETURNED,
  });

  return NextResponse.json(positions);
}
