// cspell:word timespan

import { AccountAddress } from "@aptos-labs/ts-sdk";
import { waitForVersionCached } from "lib/queries/latest-emojicoin-version";
import { type NextRequest, NextResponse } from "next/server";

import { fetchLatestPositionJson } from "@/queries/arena";
import { PositiveBigIntSchema } from "@/sdk/utils/validation/bigint";

export const fetchCache = "force-no-store";

export async function GET(request: NextRequest, { params }: { params: Promise<{ user: string }> }) {
  const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries());

  const { user } = await params;
  const parsedMinimumVersion = PositiveBigIntSchema.safeParse(searchParams.minimumVersion);

  // If a minimum version is specified- wait for it.
  if (parsedMinimumVersion.success) {
    await waitForVersionCached(parsedMinimumVersion.data);
  }

  if (!!user && !AccountAddress.isValid({ input: user, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const position = await fetchLatestPositionJson({ user });

  return NextResponse.json(position);
}
