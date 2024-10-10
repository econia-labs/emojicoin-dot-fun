import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import { MAINTENANCE_MODE } from "lib/server-env";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "router/routes";
import { normalizePossibleMarketPath } from "utils/pathname-helpers";

export default async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  console.log({MAINTENANCE_MODE, pathname, env: process.env.MAINTENANCE_MODE});
  if (MAINTENANCE_MODE && pathname !== "/maintenance") {
    return NextResponse.redirect(new URL(ROUTES.maintenance, request.url));
  }
  if (
    pathname === "/social-preview.png" ||
    pathname === "/webclip.png" ||
    pathname === "/icon.png" ||
    pathname === "/test" ||
    pathname === "/geolocation"
  ) {
    return NextResponse.next();
  }

  const possibleMarketPath = normalizePossibleMarketPath(pathname, request.url);
  if (possibleMarketPath) {
    return NextResponse.redirect(possibleMarketPath);
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
