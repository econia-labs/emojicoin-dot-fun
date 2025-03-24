// cspell:word dexscreener
// cspell:word ratelimiter
// cspell:word ratelimit
// cspell:word upstash

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import { IS_ALLOWLIST_ENABLED } from "lib/env";
import { MAINTENANCE_MODE, PRE_LAUNCH_TEASER, RATE_LIMITER } from "lib/server-env";
import { type NextRequest, NextResponse } from "next/server";
import { ROUTES } from "router/routes";
import { normalizePossibleMarketPath } from "utils/pathname-helpers";

const rateLimiters = (() => {
  if (RATE_LIMITER.enabled) {
    const redis = new Redis({
      url: RATE_LIMITER.api.url,
      token: RATE_LIMITER.api.token,
    });
    return {
      basic: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "10 s"),
      }),
      candlesticks: new Ratelimit({
        redis,
        limiter: Ratelimit.tokenBucket(10, "30 s", 20),
      }),
    };
  }
  return undefined;
})();

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

  if (rateLimiters && pathname.startsWith(ROUTES.api["."])) {
    const ip = request.ip ?? "127.0.0.1";

    const isCandlesticksRoute =
      pathname.startsWith(ROUTES.api.candlesticks) ||
      pathname.startsWith(ROUTES.api.arena.candlesticks);

    const { rateLimitResponse, domain } = isCandlesticksRoute
      ? {
          rateLimitResponse: await rateLimiters.candlesticks.limit(ip),
          domain: "api-candlesticks",
        }
      : {
          rateLimitResponse: await rateLimiters.basic.limit(ip),
          domain: "api-basic",
        };

    const { limit, reset, remaining, success } = rateLimitResponse;

    const headers = {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": reset.toString(),
      "X-RateLimit-Domain": domain,
    };

    if (!success) {
      return new NextResponse("", {
        status: 429,
        headers,
      });
    }
  }

  const dexscreenerRoutes = Object.keys(ROUTES.api.dexscreener);
  if (
    pathname === ROUTES.test ||
    pathname === ROUTES.dev["verify-status"] ||
    dexscreenerRoutes.includes(pathname)
  ) {
    return NextResponse.next();
  }

  // If path matches `/wallet/matt.apt`, but not `/wallet/matt.apt.apt`:
  if (
    pathname.startsWith(`${ROUTES.wallet}/`) &&
    pathname.endsWith(".apt") &&
    !pathname.endsWith(".apt.apt")
  ) {
    // redirect to `/wallet/matt`
    const url = new URL(pathname.slice(0, -4), request.url);
    return NextResponse.redirect(url);
  }

  // This will replace emojis in the path name with their actual text names. Since this occurs
  // before the allowlist check, it will redirect the user to the pure text version of their path
  // but then still require them to verify after.
  const possibleMarketPath = normalizePossibleMarketPath(pathname, request.url);
  if (possibleMarketPath) {
    return NextResponse.redirect(possibleMarketPath);
  }

  if (!IS_ALLOWLIST_ENABLED) {
    return NextResponse.next();
  }

  const hashed = request.cookies.get(COOKIE_FOR_HASHED_ADDRESS)?.value;
  const address = request.cookies.get(COOKIE_FOR_ACCOUNT_ADDRESS)?.value;

  if (!hashed || !address) {
    return NextResponse.redirect(new URL(ROUTES.verify, request.url));
  }

  const authenticated = await authenticate({
    address,
    hashed,
  });

  if (!authenticated) {
    return NextResponse.redirect(new URL(ROUTES.verify, request.url));
  }

  // If the user is authenticated, we can continue with the request.
  return NextResponse.next();
}

// Note this must be a static string- we can't dynamically construct it.
export const config = {
  /* eslint-disable-next-line */
  matcher: `/((?!verify|_next/static|_next/image|favicon.ico|logo192.png|icon.png|social-preview.png|manifest.json|images/wallets).*)`,
  runtime: "experimental-edge",
};
