import { type Period, toPeriod } from "@sdk/index";
import { type PeriodTypeFromDatabase } from "@sdk/indexer-v2/types/json-types";
import { parseInt } from "lodash";
import { type NextRequest } from "next/server";
import {
  type GetCandlesticksParams,
  HISTORICAL_CACHE_DURATION,
  indexToEndDate,
  indexToStartDate,
  jsonStrAppend,
  NORMAL_CACHE_DURATION,
  PARCEL_SIZE,
} from "./utils";
import { unstable_cache } from "next/cache";
import { getLatestProcessedEmojicoinTimestamp } from "@sdk/indexer-v2/queries/utils";
import { stringifyJSON } from "utils";
import { fetchPeriodicEventsSince } from "@/queries/market";

const getCandlesticks = async (params: GetCandlesticksParams) => {
  const { marketID, index, period } = params;

  const start = indexToStartDate(index, period);

  const data = await fetchPeriodicEventsSince({
    marketID,
    period,
    start,
    offset: 0,
    limit: PARCEL_SIZE,
  });

  return stringifyJSON(data);
};

const getHistoricCachedCandlesticks = unstable_cache(getCandlesticks, ["candlesticks-historic"], {
  revalidate: HISTORICAL_CACHE_DURATION,
});
const getNormalCachedCandlesticks = unstable_cache(getCandlesticks, ["candlesticks"], {
  revalidate: NORMAL_CACHE_DURATION,
});

const getCachedLatestProcessedEmojicoinTimestamp = unstable_cache(
  getLatestProcessedEmojicoinTimestamp,
  ["processor-timestamp"],
  { revalidate: 5 }
);

/* eslint-disable-next-line import/no-unused-modules */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const marketIDStr = searchParams.get("marketID");
  const indexStr = searchParams.get("index");
  const periodStr = searchParams.get("period");
  const amountStr = searchParams.get("amount");

  if (!marketIDStr || !indexStr || !periodStr || !amountStr) {
    return new Response("", { status: 400 });
  }

  if (isNaN(parseInt(marketIDStr))) {
    return new Response("", { status: 400 });
  }

  if (isNaN(parseInt(indexStr))) {
    return new Response("", { status: 400 });
  }

  if (isNaN(parseInt(amountStr))) {
    return new Response("", { status: 400 });
  }

  let period: Period;
  try {
    period = toPeriod(periodStr as PeriodTypeFromDatabase);
  } catch {
    return new Response("", { status: 400 });
  }

  const index = parseInt(indexStr);
  const marketID = parseInt(marketIDStr);
  const amount = parseInt(amountStr);

  const lastStartDate = indexToStartDate(index + amount - 1, period);

  if (lastStartDate > new Date()) {
    return new Response("", { status: 400 });
  }

  let data: string = "[]";

  const processorTimestamp = new Date(await getCachedLatestProcessedEmojicoinTimestamp());

  const promises: Promise<string>[] = [];

  for (let i = 0; i < amount; i++) {
    const localIndex = index + i;
    const endDate = indexToEndDate(localIndex, period);
    if (endDate < processorTimestamp) {
      promises.push(getHistoricCachedCandlesticks({ marketID, index: localIndex, period }));
    } else {
      promises.push(getNormalCachedCandlesticks({ marketID, index: localIndex, period }));
    }
  }

  const parcels = await Promise.all(promises);

  for (const parcel of parcels) {
    data = jsonStrAppend(data, parcel);
  }

  return new Response(data);
}
