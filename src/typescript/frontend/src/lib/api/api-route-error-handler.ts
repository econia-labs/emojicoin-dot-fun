import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

type RequestHandler = (req: NextRequest) => Promise<NextResponse>;

export function apiRouteErrorHandler(handler: RequestHandler) {
  return async function (req: NextRequest) {
    try {
      return await handler(req);
    } catch (error) {
      // Validation error.
      if (error instanceof ZodError) {
        return NextResponse.json({ message: error.issues }, { status: 400 });
      } else {
        // Unhandled error. Log error but don't expose it to the client. Also log all request details for better debugging
        console.error("An unhandled error occurred in an API route.", {
          error,
          request: {
            url: req.url,
            method: req.method,
            headers: req.headers,
            body: req.body,
            cookies: req.cookies,
          },
        });
      }
      return NextResponse.json({ message: "An unknown error occurred" }, { status: 500 });
    }
  };
}
