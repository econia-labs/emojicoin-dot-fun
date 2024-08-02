import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import { COUNTRY_UNKNOWN } from "utils/geolocation";

export async function GET(_: NextRequest) {
  const country = headers().get("x-vercel-ip-country") ?? COUNTRY_UNKNOWN;
  return new Response(country);
}
