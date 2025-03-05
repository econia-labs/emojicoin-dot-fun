import { NextRequest, NextResponse } from "next/server";
import { fetchAsset } from "@sdk/indexer-v2/queries";
import { cookies } from "next/headers";
import { unstable_cache } from "next/cache";

export const revalidate = 0;

const fetchCachedAsset = unstable_cache(fetchAsset, ["geckoterminal-fetch-asset"], {
  revalidate: 3600 * 24 * 365,
});

export async function GET(request: NextRequest) {
  // make sure no cache
  cookies();
  try {
    const searchParams = request.nextUrl.searchParams;

    const assetId = searchParams.get("id");

    if (assetId === null) {
      return new Response("id is null.", { status: 400 });
    }

    if (!/0x[0-9A-Fa-f]{64}::coin_factory::Emojicoin/.test(assetId)) {
      return new Response("id is invalid.", { status: 400 });
    }

    const res = await fetchCachedAsset(assetId.split("::")[0]);

    return NextResponse.json({
      asset: {
        id: assetId,
        name: `${res.join("")} emojicoin`,
        symbol: res.join(""),
        decimals: 8,
      },
    });
  } catch (error) {
    console.error("Failed to fetch asset:", error);

    return NextResponse.json({ error: "Failed to fetch asset." }, { status: 500 });
  }
}
