import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { stringifyJSON } from "utils";
import { parseSearchParams } from "utils/url-utils";

import { fetchSwapEvents } from "@/queries/market";

import { GetTradesSchema } from "./schema";

// Don't cache this route's response.
export const revalidate = 0;

export const GET = apiRouteErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = parseSearchParams(searchParams);
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
});
