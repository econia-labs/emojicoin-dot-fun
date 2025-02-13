// cspell:word timespan

import { toPeriod } from "@sdk/index";
import { parseInt } from "lodash";
import { type NextRequest } from "next/server";
import {
  type CandlesticksSearchParams,
  getCandlesticksRoute,
  isValidCandlesticksSearchParams,
} from "./utils";

/* eslint-disable-next-line import/no-unused-modules */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const params: CandlesticksSearchParams = {
    marketID: searchParams.get("marketID"),
    to: searchParams.get("to"),
    period: searchParams.get("period"),
    countBack: searchParams.get("countBack"),
  };

  if (!isValidCandlesticksSearchParams(params)) {
    return new Response("Invalid candlestick search params.", { status: 400 });
  }

  const marketID = parseInt(params.marketID);
  const to = parseInt(params.to);
  const period = toPeriod(params.period);
  const countBack = parseInt(params.countBack);

  try {
    const data = await getCandlesticksRoute(marketID, to, period, countBack);
    return new Response(data);
  } catch (e) {
    return new Response((e as Error).message, { status: 400 });
  }
}
