import type { IncrementalCache } from "next/dist/server/lib/incremental-cache";
import type FetchCache from "next/dist/server/lib/incremental-cache/fetch-cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// cpsell DO NOT include this in the final build.
export function GET(_request: NextRequest) {
  try {
    const { cacheHandler } = (
      globalThis as unknown as {
        __incrementalCache: IncrementalCache & { cacheHandler: FetchCache };
      }
    ).__incrementalCache;
    const endpoint = new URL(cacheHandler["cacheEndpoint"]);
    const SUSPENSE_CACHE_URL = endpoint.hostname;
    const SUSPENSE_CACHE_ENDPOINT = endpoint.toString().replace("/", "");
    const SUSPENSE_CACHE_AUTH_TOKEN = cacheHandler["headers"]["Authorization"].replace(
      "Bearer ",
      ""
    );
    return NextResponse.json({
      SUSPENSE_CACHE_URL,
      SUSPENSE_CACHE_ENDPOINT,
      SUSPENSE_CACHE_AUTH_TOKEN,
    });
  } catch (e) {
    console.error(e);
  }
  return NextResponse.json("");
}
