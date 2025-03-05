import { NextRequest, NextResponse } from "next/server";
import { fetchPair } from "@sdk/indexer-v2/queries";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";
import { postgresTimestampToDate } from "@econia-labs/emojicoin-sdk";

export const revalidate = 0;

const fetchCachedPair = unstable_cache(fetchPair, ["geckoterminal-fetch-asset"], {
  revalidate: 3600 * 24 * 365,
});

export async function GET(request: NextRequest) {
  // make sure no cache
  cookies();
  try {
    const searchParams = request.nextUrl.searchParams;

    const pairId = searchParams.get("id");

    if (pairId === null) {
      return new Response("id is null.", { status: 400 });
    }

    if (!/0x[0-9A-Fa-f]{64}::coin_factory::Emojicoin/.test(pairId)) {
      return new Response("id is invalid.", { status: 400 });
    }

    const res = await fetchCachedPair(pairId.split("::")[0]);

    return NextResponse.json({
      pair: {
        id: pairId,
        dexKey: "emojicoin-dot-fun",
        asset0Id: pairId,
        asset1Id: "0x1::aptos_coin::AptosCoin",
        createdAtBlockNumber: Number(res.block_number),
        createdAtBlockTimestamp: Math.floor(
          postgresTimestampToDate(res.transaction_timestamp).getTime() / 1000
        ),
        createdAtTxnId: res.transaction_version.toString(),
        feeBps: 0,
        creator: res.sender,
      },
    });
  } catch (error) {
    console.error("Failed to fetch pair:", error);

    return NextResponse.json({ error: "Failed to fetch pair." }, { status: 500 });
  }
}
