import { fetchSwapEvents } from "@/queries/market";
import { stringifyJSON } from "utils";
import { GetTradesSchema } from "./schema";
import { NextResponse } from "next/server";

// Don't cache this route's response.
export const revalidate = 0;

export const GET = async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const params = Object.fromEntries(searchParams.entries());
  const { page, sender, limit, marketID, orderBy, symbolEmojis } = GetTradesSchema.parse(params);
  if (!sender && !marketID && !symbolEmojis) {
    return NextResponse.json(
      { error: "At least one of address, marketID or symbolEmojis is required" },
      {
        status: 400,
      }
    );
  }

  const swaps = await fetchSwapEvents({
    sender,
    marketID,
    pageSize: limit,
    page,
    orderBy,
    symbolEmojis,
  });

  return new NextResponse(stringifyJSON(swaps));
};
