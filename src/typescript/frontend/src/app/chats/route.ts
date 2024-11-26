import { fetchChatEvents, tryFetchFirstChatEvent } from "@/queries/market";
import { Parcel } from "lib/parcel";
import type { NextRequest } from "next/server";
import { isNumber } from "utils";

type ChatSearchParams = {
  marketID: string | null;
  toMarketNonce: string | null;
};

export type ValidChatSearchParams = {
  marketID: string;
  toMarketNonce: string;
};

const isValidChatSearchParams = (params: ChatSearchParams): params is ValidChatSearchParams => {
  const { marketID, toMarketNonce } = params;
  // prettier-ignore
  return (
    marketID !== null && isNumber(marketID) &&
    toMarketNonce !== null && isNumber(toMarketNonce)
  );
};

type Chat = Awaited<ReturnType<typeof fetchChatEvents>>[number];

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: ChatSearchParams = {
    marketID: searchParams.get("marketID"),
    toMarketNonce: searchParams.get("toMarketNonce"),
  };

  if (!isValidChatSearchParams(params)) {
    return new Response("Invalid chat search params.", { status: 400 });
  }

  const marketID = Number(params.marketID);
  const toMarketNonce = Number(params.toMarketNonce);

  const queryHelper = new Parcel<Chat, { marketID: number }>({
    parcelSize: 20,
    normalRevalidate: 5,
    historicRevalidate: 365 * 24 * 60 * 60,
    fetchHistoricThreshold: (query) =>
      fetchChatEvents({ marketID: query.marketID, amount: 1 }).then((r) =>
        Number(r[0].market.marketNonce)
      ),
    fetchFirst: (query) => tryFetchFirstChatEvent(query.marketID),
    cacheKey: "chats",
    getKey: (s) => Number(s.market.marketNonce),
    fetchFn: ({ to, count }, { marketID }) =>
      fetchChatEvents({ marketID, toMarketNonce: to, amount: count }),
  });

  const res = await queryHelper.getUnparsedData(toMarketNonce, 50, { marketID });

  return new Response(res);
}
