// cspell:word dexscreener
import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import { MAINTENANCE_MODE, PRE_LAUNCH_TEASER } from "lib/server-env";
import { IS_ALLOWLIST_ENABLED } from "lib/env";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "router/routes";
import { normalizePossibleMarketPath } from "utils/pathname-helpers";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  prefix: "general",
});

// Separate rate limitter for candlesticks in order to allow for more queries on
// the candlesticks without ratelimitting the rest of the website.
const candlestickRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  prefix: "candlestick",
});

export default async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  if (pathname === ROUTES["launching-soon"]) {
    return NextResponse.next();
  }
  if (PRE_LAUNCH_TEASER && pathname !== ROUTES["launching-soon"]) {
    return NextResponse.redirect(new URL(ROUTES["launching-soon"], request.url));
  }
  if (MAINTENANCE_MODE && pathname !== ROUTES.maintenance) {
    return NextResponse.redirect(new URL(ROUTES.maintenance, request.url));
  }

  const ip = request.ip ?? "127.0.0.1";

  let limit: number;
  let reset: number;
  let remaining: number;
  let domain: string;
  let success: boolean;

  if (pathname === ROUTES.api.candlesticks || pathname === "/candlesticks") {
    const ratelimitRes = await candlestickRatelimit.limit(ip);
    limit = ratelimitRes.limit;
    reset = ratelimitRes.reset;
    remaining = ratelimitRes.remaining;
    success = ratelimitRes.success;
    domain = "candlesticks";
  } else {
    const ratelimitRes = await ratelimit.limit(ip);
    limit = ratelimitRes.limit;
    reset = ratelimitRes.reset;
    remaining = ratelimitRes.remaining;
    success = ratelimitRes.success;
    domain = "general";
  }

  const headers = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
    "X-RateLimit-Domain": domain,
  };

  if (!success) {
    return new Response("", {
      status: 429,
      headers,
    });
  }

  const dexscreenerRoutes = Object.keys(ROUTES.api.dexscreener);
  if (
    pathname === ROUTES.test ||
    pathname === ROUTES.dev["verify-status"] ||
    dexscreenerRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // This will replace emojis in the path name with their actual text names. Since this occurs
  // before the allowlist check, it will redirect the user to the pure text version of their path
  // but then still require them to verify after.
  const possibleMarketPath = normalizePossibleMarketPath(pathname, request.url);
  if (possibleMarketPath) {
    return NextResponse.redirect(possibleMarketPath, { headers });
  }

  if (!IS_ALLOWLIST_ENABLED) {
    return NextResponse.next({ headers });
  }

  const hashed = request.cookies.get(COOKIE_FOR_HASHED_ADDRESS)?.value;
  const address = request.cookies.get(COOKIE_FOR_ACCOUNT_ADDRESS)?.value;

  if (!hashed || !address) {
    return NextResponse.redirect(new URL(ROUTES.verify, request.url), { headers });
  }

  const authenticated = await authenticate({
    address,
    hashed,
  });

  if (!authenticated) {
    return NextResponse.redirect(new URL(ROUTES.verify, request.url), { headers });
  }

  // If the user is authenticated, we can continue with the request.
  return NextResponse.next({ headers });
}

// Note this must be a static string- we can't dynamically construct it.
export const config = {
  /* eslint-disable-next-line */
  matcher: `/((?!verify|_next/static|_next/image|favicon.ico|logo192.png|icon.png|social-preview.png|manifest.json|images/wallets).*)`,
  runtime: "experimental-edge",
};
