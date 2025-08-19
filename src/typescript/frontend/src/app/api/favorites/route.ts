import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { parseSearchParams } from "utils/url-utils";

import { ViewFavorites } from "@/move-modules/favorites";
import { fetchMarketsJson } from "@/queries/home";
import { symbolBytesToEmojis } from "@/sdk/index";
import { getAptosClient } from "@/sdk/utils/aptos-client";
import { AccountAddressSchema } from "@/sdk/utils/validation/account-address";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export const GET = apiRouteErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const params = parseSearchParams(searchParams);
  const accountAddress = AccountAddressSchema.parse(params);

  if (!accountAddress) {
    return NextResponse.json([], { status: 400 });
  }

  try {
    const aptos = getAptosClient();
    const favoritesAsSymbols = (
      await ViewFavorites.view({ aptos, user: accountAddress }).then((res) => res)
    )
      .map(symbolBytesToEmojis)
      .map((r) => r.emojis.map((v) => v.emoji));
    const res = await fetchMarketsJson({ selectEmojis: favoritesAsSymbols });
    return NextResponse.json(res);
  } catch (e) {
    console.error(e);
    return NextResponse.json([], { status: 500 });
  }
});
