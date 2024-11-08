import { fetchPeriodicEventsSince } from "@/queries/market";
import { type Period, toPeriod } from "@sdk/index";
import { type PeriodicStateEventModel } from "@sdk/indexer-v2/types";
import { type PeriodTypeFromDatabase } from "@sdk/indexer-v2/types/json-types";
import { logFetch } from "lib/logging";
import { parseInt } from "lodash";
import { unstable_cache } from "next/cache";
import { type NextRequest } from "next/server";
import { stringifyJSON } from "utils";

const CANDLESTICKS_LIMIT = 500;

type QueryParams = {
  marketID: number;
  start: Date;
  period: Period;
  limit: number;
};

const getCandlesticks = async (params: QueryParams) => {
  const { marketID, start, period, limit } = params;
  const aggregate: PeriodicStateEventModel[] = [];

  while (aggregate.length < limit) {
    const data = await fetchPeriodicEventsSince({
      marketID,
      period,
      start,
      offset: aggregate.length,
      limit: limit - aggregate.length,
    });
    aggregate.push(...data);
    if (data.length < limit) {
      break;
    }
  }

  return stringifyJSON(aggregate);
};

const getCachedCandlesticks = unstable_cache(getCandlesticks, ["candlesticks"], { revalidate: 10 });

/* eslint-disable-next-line import/no-unused-modules */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const marketIDStr = searchParams.get("marketID");
  const startStr = searchParams.get("start");
  const periodStr = searchParams.get("period");
  const limitStr = searchParams.get("limit");

  if (!marketIDStr || !startStr || !periodStr || !limitStr) {
    return new Response("", { status: 400 });
  }

  if (isNaN(parseInt(marketIDStr))) {
    return new Response("", { status: 400 });
  }

  if (isNaN(parseInt(startStr))) {
    return new Response("", { status: 400 });
  }

  let period: Period;
  try {
    period = toPeriod(periodStr as PeriodTypeFromDatabase);
  } catch {
    return new Response("", { status: 400 });
  }

  if (isNaN(parseInt(limitStr)) || parseInt(limitStr) > CANDLESTICKS_LIMIT) {
    return new Response("", { status: 400 });
  }

  const start = new Date(parseInt(startStr) * 1000);
  const limit = parseInt(limitStr);
  const marketID = parseInt(marketIDStr);

  const data = await logFetch(getCachedCandlesticks, { marketID, start, period, limit });

  return new Response(data);
}
