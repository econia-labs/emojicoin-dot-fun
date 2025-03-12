import { NextResponse, type NextRequest } from "next/server";
import { getCandlesticksRoute } from "./utils";
import { CandlesticksSearchParamsSchema } from "./search-params-schema";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const paramsObject = Object.fromEntries(searchParams.entries());
  const {
    data: validatedParams,
    success,
    error,
  } = CandlesticksSearchParamsSchema.safeParse(paramsObject);

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
    const data = await getCandlesticksRoute(validatedParams);
    return new NextResponse(data);
  } catch (e) {
    return new NextResponse((e as Error).message, { status: 400 });
  }
}
