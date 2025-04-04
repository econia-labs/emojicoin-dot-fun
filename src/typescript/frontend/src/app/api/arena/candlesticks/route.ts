import { type NextRequest, NextResponse } from "next/server";

import { fetchArenaCandlesticksRoute } from "./fetch";
import { ArenaCandlesticksSearchParamsSchema } from "./search-params-schema";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(searchParams.entries());
  const {
    data: validatedParams,
    success,
    error,
  } = ArenaCandlesticksSearchParamsSchema.safeParse(params);

  if (!success) {
    return NextResponse.json(
      {
        error: "Invalid search params",
        details: error.flatten().fieldErrors,
      },
      {
        status: 400,
      }
    );
  }

  try {
    const data = await fetchArenaCandlesticksRoute(validatedParams);
    return new NextResponse(data);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
}
