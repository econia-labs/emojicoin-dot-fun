// cspell:word timespan

import { fetchArenaLeaderboardHistoryWithArenaInfo } from "@/queries/arena";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { cookies } from "next/headers";
import { type NextRequest } from "next/server";
import { stringifyJSON } from "utils";

/* eslint-disable-next-line import/no-unused-modules */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  cookies();
  const address = (await params).address;
  let skip: number;
  try {
    skip = Number(request.nextUrl.searchParams.get("skip") ?? "0");
  } catch {
    return new Response("Invalid skip.", { status: 400 });
  }
  if (Number.isNaN(skip) || skip < 0 || skip != Math.round(skip)) {
    return new Response("Invalid skip.", { status: 400 });
  }

  if (!AccountAddress.isValid({ input: address, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const position = await fetchArenaLeaderboardHistoryWithArenaInfo({
    user: address,
    skip,
    amount: 25,
  });

  return new Response(stringifyJSON(position ?? undefined));
}
