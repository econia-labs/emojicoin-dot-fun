import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseSearchParams } from "utils/url-utils";

import { fetchMarketsJson } from "@/queries/home";

import { SearchSchema } from "./schema";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = apiRouteErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = parseSearchParams(searchParams);
  const { page, sortBy, searchBytes: emojis } = SearchSchema.parse(params);

  if (!emojis) {
    return NextResponse.json([], { status: 400 });
  }

  try {
    const res = await fetchMarketsJson({ searchEmojis: emojis, page, sortBy });
    return NextResponse.json(res);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
});
