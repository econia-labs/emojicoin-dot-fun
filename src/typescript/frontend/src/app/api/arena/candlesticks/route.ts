import { NextResponse, type NextRequest } from "next/server";
import { ArenaCandlesticksSearchParamsSchema } from "./search-params-schema";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const params = Object.fromEntries(searchParams.entries());
  const validated = ArenaCandlesticksSearchParamsSchema.safeParse(params);

  if (!validated.success) {
    return NextResponse.json({
      error: "Invalid search params", 
      details: validated.error.flatten().fieldErrors,
    }, {
      status: 400,
    })
  }
  

}
