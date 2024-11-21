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

export default async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/launching") {
    return NextResponse.next();
  }
  if (PRE_LAUNCH_TEASER && pathname !== "/launching") {
    return NextResponse.redirect(new URL(ROUTES.launching, request.url));
  }
  if (MAINTENANCE_MODE && pathname !== "/maintenance") {
    return NextResponse.redirect(new URL(ROUTES.maintenance, request.url));
  }
  if (pathname === "/test" || pathname === "/verify_status") {
    return NextResponse.next();
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

const negativeLookaheads = [
  "verify",
  "api",
  "_next/static",
  "_next/image",
  "favicon.ico",
  "logo192.png",
  "icon.png",
  "webclip.png",
  "social-preview.png",
  "okx-logo.png",
  "manifest.json",
].join("|");

export const config = {
  matcher: `/((?!${negativeLookaheads}).*)`,
};
