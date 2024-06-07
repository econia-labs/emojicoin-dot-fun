import { getSessionCookies } from "components/pages/verify/cookies";
import { authenticate } from "components/pages/verify/verify";
import { NextResponse, type NextRequest } from "next/server";
import { ROUTES } from "router/routes";

export default async function middleware(request: NextRequest) {
  const cookies = await getSessionCookies(request);

  // If the cookies are not set, redirect to the verification page.
  if (!cookies) {
    return NextResponse.redirect(new URL(ROUTES.verify, request.url));
  }

  const { pubkey, signature, accountScheme, accountAddress } = cookies;

  const authenticated = await authenticate({
    pubkey,
    signature,
    scheme: accountScheme,
    address: accountAddress,
  });

  if (!authenticated) {
    return NextResponse.redirect(new URL(ROUTES.verify));
  }

  // If the user is authenticated, we can continue with the request.
  return NextResponse.next();
}

export const config = {
  matcher: "/((?!verify|api|_next/static|_next/image|favicon.ico|logo192.png).*)",
};
