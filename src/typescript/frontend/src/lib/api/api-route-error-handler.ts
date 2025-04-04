import { ZodError } from "zod";

type RequestHandler = (req: Request) => Promise<Response>;

export function apiRouteErrorHandler(handler: RequestHandler) {
  return async function (req: Request) {
    try {
      return await handler(req);
    } catch (error) {
      // Validation error.
      if (error instanceof ZodError) {
        return Response.json({ message: error.issues }, { status: 400 });
        // Unhandled error.
      } else {
        // Log error but don't expose it to the client.
        console.error(error);
      }
      return Response.json({ message: "An unknown error occurred" }, { status: 500 });
    }
  };
}
