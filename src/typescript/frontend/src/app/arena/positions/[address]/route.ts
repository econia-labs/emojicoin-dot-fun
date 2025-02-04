// cspell:word timespan

import { fetchArenaLeaderboardHistoryWithArenaInfo } from "@/queries/arena";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { type NextRequest } from "next/server";
import { stringifyJSON } from "utils";

/* eslint-disable-next-line import/no-unused-modules */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  const address = (await params).address;
  let skip: bigint;
  try {
    skip = BigInt(request.nextUrl.searchParams.get("skip") ?? "0");
  } catch {
    return new Response("Invalid skip.", { status: 400 });
  }
  if (skip < 0n) {
    return new Response("Invalid skip.", { status: 400 });
  }

  if (!AccountAddress.isValid({ input: address, strict: true }).valid) {
    return new Response("Invalid address.", { status: 400 });
  }

  const position = await fetchArenaLeaderboardHistoryWithArenaInfo({ user: address, skip });

  return new Response(stringifyJSON(position ?? undefined));
}
