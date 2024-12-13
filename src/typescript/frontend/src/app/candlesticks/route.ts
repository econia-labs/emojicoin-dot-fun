import { type Period, toPeriod } from "@sdk/index";
import { parseInt } from "lodash";
import { type NextRequest } from "next/server";
import {
  type CandlesticksSearchParams,
  getPeriodDurationSeconds,
  HISTORICAL_CACHE_DURATION,
  isValidCandlesticksSearchParams,
  NORMAL_CACHE_DURATION,
} from "./utils";
import { getLatestProcessedEmojicoinTimestamp } from "@sdk/indexer-v2/queries/utils";
import { fetchPeriodicEventsTo, tryFetchMarketRegistration } from "@/queries/market";
import { Parcel } from "lib/parcel";
import { stringifyJSON } from "utils";

type CandlesticksDataType = Awaited<ReturnType<typeof fetchPeriodicEventsTo>>;

const getCandlesticksParcel = async (
  { to, count }: { to: number; count: number },
  query: { marketID: number; period: Period }
) => {
  const endDate = new Date(to * 1000);

  const data = await fetchPeriodicEventsTo({
    ...query,
    end: endDate,
    amount: count,
  });

  return data;
};

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

  const queryHelper = new Parcel<CandlesticksDataType[number]>({
    parcelSize: 500,
    currentRevalidate: NORMAL_CACHE_DURATION,
    historicRevalidate: HISTORICAL_CACHE_DURATION,
    fetchHistoricThreshold: () => getLatestProcessedEmojicoinTimestamp().then((r) => r.getTime()),
    fetchFirst: () => tryFetchMarketRegistration(marketID),
    cacheKey: "candlesticks",
    getKey: (s) => Number(s.periodicMetadata.startTime / 1000n / 1000n),
    fetchFn: (params) => getCandlesticksParcel(params, { marketID, period }),
    step: getPeriodDurationSeconds(period),
  });

  try {
    const data = await queryHelper.getData(to, countBack);
    return new Response(stringifyJSON(data));
  } catch (e) {
    return new Response(e as string, { status: 400 });
  }
}
