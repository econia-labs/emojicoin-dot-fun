import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

export default async function middleware(request: NextRequest) {
  const auth = request.headers.get("NEXT_PRIVATE_INTERNAL_AUTH_KEY");
  return auth === process.env.NEXT_PRIVATE_INTERNAL_AUTH_KEY
    ? NextResponse.next()
    : new NextResponse("Invalid auth key.", {
        status: 401,
      });
}

export const config = {
  matcher: `/((?!_next/static|_next/image|favicon.ico|logo192.png|icon.png|social-preview.png|manifest.json|images/wallets).*)`,
  runtime: "experimental-edge",
};
