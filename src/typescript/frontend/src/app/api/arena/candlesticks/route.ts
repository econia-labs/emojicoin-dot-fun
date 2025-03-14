import { NextResponse, type NextRequest } from "next/server";
import { ArenaCandlesticksSearchParamsSchema } from "./search-params-schema";
import { fetchArenaCandlesticksRoute } from "./fetch";

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
