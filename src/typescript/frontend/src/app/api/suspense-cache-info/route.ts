import type { IncrementalCache } from "next/dist/server/lib/incremental-cache";
import type FetchCache from "next/dist/server/lib/incremental-cache/fetch-cache";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { VERCEL, VERCEL_TARGET_ENV } from "@/sdk/index";

export const dynamic = "force-dynamic";

/**
 * Facilitates viewing the suspense cache url and authentication token in preview builds.
 *
 * The auth token is a very short-lived API token that is used to POST to Vercel's CDN infra for
 * cached data.
 *
 * ⚠️ Only available in Vercel preview environments with protection bypass enabled.
 *
 * With these values, you can directly interact with the Vercel suspense cache infra.
 *
 * @example
 * curl -i -H "Authorization: Bearer $SUSPENSE_CACHE_AUTH_TOKEN" "https://$SUSPENSE_CACHE_URL/v1/suspense-cache/$CACHE_KEY"
 */
export function GET(request: NextRequest) {
  if (!VERCEL || VERCEL_TARGET_ENV !== "preview") {
    console.warn("Suspense cache info requested in non-preview environment.");
    return new NextResponse("Only available in preview mode.", { status: 403 });
  }

  // Always require the protection bypass token.
  const protectionBypassToken = request.headers.get("x-vercel-protection-bypass");
  if (protectionBypassToken !== process.env.VERCEL_AUTOMATION_PROTECTION_BYPASS) {
    console.warn("Unauthenticated attempt to retrieve suspense cache info.");
    return new NextResponse("Missing or invalid authentication.", { status: 401 });
  }

  try {
    const { cacheHandler } = (
      globalThis as unknown as {
        __incrementalCache: IncrementalCache & { cacheHandler: FetchCache };
      }
    ).__incrementalCache;
    const endpoint = new URL(cacheHandler["cacheEndpoint"]);
    const SUSPENSE_CACHE_URL = endpoint.hostname;
    const SUSPENSE_CACHE_AUTH_TOKEN = cacheHandler["headers"]["Authorization"].replace(
      "Bearer ",
      ""
    );
    return NextResponse.json({
      SUSPENSE_CACHE_URL,
      SUSPENSE_CACHE_AUTH_TOKEN,
    });
  } catch (e) {
    console.error(e);
  }
  return NextResponse.json("");
}
