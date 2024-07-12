import { SYMBOL_DATA } from "@sdk/emoji_data";
import {
  COOKIE_FOR_ACCOUNT_ADDRESS,
  COOKIE_FOR_HASHED_ADDRESS,
} from "components/pages/verify/session-info";
import { authenticate } from "components/pages/verify/verify";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "router/routes";

export default async function middleware(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  if (
    pathname === "/social-preview.png" ||
    pathname === "/webclip.png" ||
    pathname === "/icon.png"
  ) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/market/")) {
    const slug = decodeURIComponent(pathname.slice(8));
    const emojis = [...new Intl.Segmenter().segment(slug)].map(x => x.segment);
    const chars = emojis.map((x) => SYMBOL_DATA.byEmoji(x)?.name);
    if(chars.reduce((p, c) => p && c !== undefined, true)) {
      const name = chars.join(",");
      return NextResponse.redirect(new URL(`/market/${name}`, request.url))
    }
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
