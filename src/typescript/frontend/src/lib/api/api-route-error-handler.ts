import "server-only";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

type RouteCtx<P extends object = {}> = { params: P };

export function apiRouteErrorHandler<P extends object = {}>(
  handler: (req: NextRequest, ctx: RouteCtx<P>) => Promise<Response> | Response
) {
  return async function (req: NextRequest, ctx: RouteCtx<P>) {
    try {
      return await handler(req, ctx);
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
