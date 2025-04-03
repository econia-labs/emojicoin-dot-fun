import { AccountAddress } from "@aptos-labs/ts-sdk";
import { safeParsePageWithDefault } from "lib/routes/home-page-params";
import { type NextRequest, NextResponse } from "next/server";
import { stringifyJSON } from "utils";

import {
  fetchArenaInfo,
  fetchArenaLeaderboardHistoryWithArenaInfo,
  fetchPosition,
} from "@/queries/arena";
import type { ArenaLeaderboardHistoryWithArenaInfoModel } from "@/sdk/index";
import { positionToUserEscrow, toUserEscrowJson } from "@/sdk/index";

const ROWS_RETURNED = 100;

export const fetchCache = "force-no-store";

// NOTE: This just returns the first 100 historical escrows + the current escrow.
// Past that, it would require custom pagination.
export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const user = (await params).user;

  if (!!user && !AccountAddress.isValid({ input: user, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const historicalPositions = fetchArenaLeaderboardHistoryWithArenaInfo({
    user,
    page: 1,
    pageSize: ROWS_RETURNED,
  })
    .catch((e) => {
      console.error(e);
      return [] as ArenaLeaderboardHistoryWithArenaInfoModel[];
    })
    .then((res) => res.map(positionToUserEscrow));

  const currentPosition = fetchArenaInfo({})
    .then(async (info) => {
      if (!info) return null;
      return await fetchPosition({ user, meleeID: info.meleeID }).then((position) => {
        if (!position) return null;
        return positionToUserEscrow({
          ...position,
          ...info,
        });
      });
    })
    .then((currentPosition) => (currentPosition ? [currentPosition] : []));

  const escrows = await Promise.all([historicalPositions, currentPosition]).then(
    ([historical, current]) => [...historical, ...current]
  );

  return NextResponse.json(escrows.map(toUserEscrowJson));
}
