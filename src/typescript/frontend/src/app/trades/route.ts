import { fetchSwapEvents } from "@/queries/market";
import type { NextRequest } from "next/server";
import { stringifyJSON } from "utils";

type SwapSearchParams = {
  marketID: string | null;
  fromMarketNonce: string | null;
};

export type ValidSwapSearchParams = {
  marketID: string;
  fromMarketNonce: string;
};

const isNumber = (s: string) => !isNaN(parseInt(s));

const isValidSwapSearchParams = (params: SwapSearchParams): params is ValidSwapSearchParams => {
  const { marketID, fromMarketNonce } = params;
  // prettier-ignore
  return (
    marketID !== null && isNumber(marketID) &&
    fromMarketNonce !== null && isNumber(fromMarketNonce)
  );
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: SwapSearchParams = {
    marketID: searchParams.get("marketID"),
    fromMarketNonce: searchParams.get("fromMarketNonce"),
  };

  if (!isValidSwapSearchParams(params)) {
    return new Response("Invalid chat search params.", { status: 400 });
  }

  const marketID = Number(params.marketID);
  const fromMarketNonce = Number(params.fromMarketNonce);

  const res = await fetchSwapEvents({ marketID, fromMarketNonce });

  return new Response(stringifyJSON(res));
}
