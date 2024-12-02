import { fetchSwapEvents, tryFetchFirstSwapEvent } from "@/queries/market";
import { Parcel } from "lib/parcel";
import type { NextRequest } from "next/server";
import { isNumber } from "utils";

type SwapSearchParams = {
  marketID: string | null;
  toMarketNonce: string | null;
};

export type ValidSwapSearchParams = {
  marketID: string;
  toMarketNonce: string;
};

const isValidSwapSearchParams = (params: SwapSearchParams): params is ValidSwapSearchParams => {
  const { marketID, toMarketNonce } = params;
  // prettier-ignore
  return (
    marketID !== null && isNumber(marketID) &&
    toMarketNonce !== null && isNumber(toMarketNonce)
  );
};

type Swap = Awaited<ReturnType<typeof fetchSwapEvents>>[number];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: SwapSearchParams = {
    marketID: searchParams.get("marketID"),
    toMarketNonce: searchParams.get("toMarketNonce"),
  };

  if (!isValidSwapSearchParams(params)) {
    return new Response("Invalid swap search params.", { status: 400 });
  }

  const marketID = Number(params.marketID);
  const toMarketNonce = Number(params.toMarketNonce);

  const queryHelper = new Parcel<Swap, { marketID: number }>({
    parcelSize: 20,
    normalRevalidate: 5,
    historicRevalidate: 365 * 24 * 60 * 60,
    fetchHistoricThreshold: (query) =>
      fetchSwapEvents({ marketID: query.marketID, amount: 1 }).then((r) =>
        Number(r[0].market.marketNonce)
      ),
    fetchFirst: (query) => tryFetchFirstSwapEvent(query.marketID),
    cacheKey: "swaps",
    getKey: (s) => Number(s.market.marketNonce),
    fetchFn: ({ to, count }, { marketID }) =>
      fetchSwapEvents({ marketID, toMarketNonce: to, amount: count }),
  });

  const res = await queryHelper.getUnparsedData(toMarketNonce, 20, { marketID });

  return new Response(res);
}
