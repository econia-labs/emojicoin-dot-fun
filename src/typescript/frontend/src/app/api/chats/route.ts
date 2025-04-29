import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { type NextRequest, NextResponse } from "next/server";
import { stringifyJSON } from "utils";
import { parseSearchParams } from "utils/url-utils";

import { fetchChatEvents } from "@/queries/market";

import { GetChatsSchema } from "./schema";

export const revalidate = 0;

export const GET = apiRouteErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const rawParams = parseSearchParams(searchParams);

  const { page, limit, marketID, orderBy } = GetChatsSchema.parse(rawParams);
  const swaps = await fetchChatEvents({ marketID, pageSize: limit, page, orderBy });

  return new NextResponse(stringifyJSON(swaps));
});
