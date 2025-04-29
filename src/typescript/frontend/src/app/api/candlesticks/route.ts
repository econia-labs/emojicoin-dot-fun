import { apiRouteErrorHandler } from "lib/api/api-route-error-handler";
import { type NextRequest, NextResponse } from "next/server";

import { CandlesticksSearchParamsSchema } from "./search-params-schema";
import { getCandlesticksRoute } from "./utils";

export const GET = apiRouteErrorHandler(async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const paramsObject = Object.fromEntries(searchParams.entries());
  const validatedParams = CandlesticksSearchParamsSchema.parse(paramsObject);

  try {
    const data = await getCandlesticksRoute(validatedParams);
    return new NextResponse(data);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
});
