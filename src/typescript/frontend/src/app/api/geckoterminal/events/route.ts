import { NextRequest, NextResponse } from "next/server";
import { fetchEvents } from "@sdk/indexer-v2/queries";
import { cookies } from "next/headers";

export const revalidate = 0;

export async function GET(request: NextRequest) {
  // make sure no cache
  cookies();
  try {
    const searchParams = request.nextUrl.searchParams;

    const { fromBlock, toBlock } = {
      fromBlock: Number(searchParams.get("fromBlock") ?? "NaN"),
      toBlock: Number(searchParams.get("toBlock") ?? "NaN"),
    };

    if (Number.isNaN(fromBlock)) {
      return new Response("fromBlock is not a number.", { status: 400 });
    }
    if (Number.isNaN(toBlock)) {
      return new Response("toBlock is not a number.", { status: 400 });
    }
    if (fromBlock < 0) return new Response("fromBlock must be at least 0.", { status: 400 });
    if (toBlock < 0) return new Response("toBlock must be at least 0.", { status: 400 });

    const res = await fetchEvents({ fromBlock, toBlock });

    return NextResponse.json({ events: res });
  } catch (error) {
    console.error("Failed to fetch events:", error);

    return NextResponse.json({ error: "Failed to fetch events." }, { status: 500 });
  }
}
