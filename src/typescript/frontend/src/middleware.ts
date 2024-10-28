import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import { IS_ALLOWLIST_ENABLED } from "lib/env";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "router/routes";
import { normalizePossibleMarketPath } from "utils/pathname-helpers";

export default async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  if (
    pathname === "/social-preview.png" ||
    pathname === "/webclip.png" ||
    pathname === "/icon.png" ||
    pathname === "/test" ||
    pathname === "/geolocation" ||
    pathname === "/verify_status"
  ) {
    return NextResponse.next();
  }

  if (!IS_ALLOWLIST_ENABLED) {
    return NextResponse.next();
  }

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

export const config = {
  matcher: "/((?!verify|api|_next/static|_next/image|favicon.ico|logo192.png|manifest.json).*)",
};
