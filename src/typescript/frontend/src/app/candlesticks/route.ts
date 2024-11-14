import { toPeriod } from "@sdk/index";
import { parseInt } from "lodash";
import { type NextRequest } from "next/server";
import {
  type CandlesticksSearchParams,
  type GetCandlesticksParams,
  HISTORICAL_CACHE_DURATION,
  indexToParcelEndDate,
  indexToParcelStartDate,
  isValidCandlesticksSearchParams,
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

  const start = indexToParcelStartDate(index, period);

  const data = await fetchPeriodicEventsSince({
    marketID,
    period,
    start,
    offset: 0,
    limit: PARCEL_SIZE,
  });

  return stringifyJSON(data);
};

/**
 * Fetch all of the parcels of candlesticks that have completely ended.
 * The only difference between this and {@link getNormalCachedCandlesticks} is the cache tag and
 * thus how long the data is cached for.
 */
const getHistoricCachedCandlesticks = unstable_cache(getCandlesticks, ["candlesticks-historic"], {
  revalidate: HISTORICAL_CACHE_DURATION,
});

/**
 * Fetch all candlestick parcels that haven't completed yet.
 * The only difference between this and {@link getHistoricCachedCandlesticks} is the cache tag and
 * thus how long the data is cached for.
 */
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
  const params: CandlesticksSearchParams = {
    marketID: searchParams.get("marketID"),
    index: searchParams.get("index"),
    period: searchParams.get("period"),
    amount: searchParams.get("amount"),
  };

  if (!isValidCandlesticksSearchParams(params)) {
    return new Response("Invalid candlestick search params.", { status: 400 });
  }

  const marketID = parseInt(params.marketID);
  const index = parseInt(params.index);
  const period = toPeriod(params.period);
  const numParcels = parseInt(params.amount);

  // Ensure that the last start date as calculated per the search params is valid.
  // This is specifically the last parcel's start date- aka the last parcel's first candlestick's
  // start time.
  const lastParcelStartDate = indexToParcelStartDate(index + numParcels - 1, period);
  if (lastParcelStartDate > new Date()) {
    return new Response("The last parcel's start date cannot be later than the current time.", {
      status: 400,
    });
  }

  let data: string = "[]";

  const processorTimestamp = new Date(await getCachedLatestProcessedEmojicoinTimestamp());

  for (let i = 0; i < numParcels; i++) {
    const localIndex = index + i;
    const endDate = indexToParcelEndDate(localIndex, period);
    if (endDate < processorTimestamp) {
      const res = await getHistoricCachedCandlesticks({ marketID, index: localIndex, period });
      data = jsonStrAppend(data, res);
    } else {
      const res = await getNormalCachedCandlesticks({ marketID, index: localIndex, period });
      data = jsonStrAppend(data, res);
    }
  }

  return new Response(data);
}
