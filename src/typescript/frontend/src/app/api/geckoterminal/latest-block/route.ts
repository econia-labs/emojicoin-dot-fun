import { NextRequest, NextResponse } from "next/server";
import { fetchLatestBlock } from "@sdk/indexer-v2/queries";
import { cookies } from "next/headers";

export const revalidate = 0;

export async function GET(_request: NextRequest) {
  // make sure no cache
  cookies();
  try {
    const res = await fetchLatestBlock({});

    return NextResponse.json({
      block: {
        blockNumber: res!.blockNumber,
        blockTimestamp: Math.floor(res!.transactionTimestamp.getTime() / 1000),
      },
    });
  } catch (error) {
    console.error("Failed to fetch latest block:", error);

    return NextResponse.json({ error: "Failed to fetch latest block." }, { status: 500 });
  }
}
