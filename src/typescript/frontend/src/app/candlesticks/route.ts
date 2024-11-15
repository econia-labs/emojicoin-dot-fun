// cspell:word timespan

import {
  type AnyNumberString,
  compareBigInt,
  getPeriodStartTimeFromTime,
  toPeriod,
} from "@sdk/index";
import { parseInt } from "lodash";
import { type NextRequest } from "next/server";
import {
  type CandlesticksSearchParams,
  type GetCandlesticksParams,
  getPeriodDurationSeconds,
  HISTORICAL_CACHE_DURATION,
  indexToParcelEndDate,
  indexToParcelStartDate,
  isValidCandlesticksSearchParams,
  jsonStrAppend,
  NORMAL_CACHE_DURATION,
  PARCEL_SIZE,
  toIndex,
} from "./utils";
import { unstable_cache } from "next/cache";
import { getLatestProcessedEmojicoinTimestamp } from "@sdk/indexer-v2/queries/utils";
import { parseJSON, stringifyJSON } from "utils";
import { fetchMarketRegistration, fetchPeriodicEventsSince } from "@/queries/market";

/**
 * @property `data` the stringified version of {@link CandlesticksDataType}.
 * @property `count` the number of rows returned.
 */
type GetCandlesticksResponse = {
  data: string;
  count: number;
};

type CandlesticksDataType = Awaited<ReturnType<typeof fetchPeriodicEventsSince>>;

const getCandlesticks = async (params: GetCandlesticksParams) => {
  const { marketID, index, period } = params;

  const start = indexToParcelStartDate(index, period);

  const periodDurationMilliseconds = getPeriodDurationSeconds(period) * 1000;
  const timespan = periodDurationMilliseconds * PARCEL_SIZE;
  const end = new Date(start.getTime() + timespan);

  // PARCEL_SIZE determines the max number of rows, so we don't need to pass a `LIMIT` value.
  // `start` and `end` determine the level of pagination, so no need to specify `offset` either.
  const data = await fetchPeriodicEventsSince({
    marketID,
    period,
    start,
    end,
  });

  return {
    data: stringifyJSON(data),
    count: data.length,
  };
};

/**
 * Returns the market registration event for a market if it exists.
 *
 * If it doesn't exist, it throws an error so that the value isn't cached in the
 * `unstable_cache` call.
 *
 * @see {@link getCachedMarketRegistrationMs}
 */
const getMarketRegistrationMs = async (marketID: AnyNumberString) =>
  fetchMarketRegistration({ marketID }).then((res) => {
    if (res) {
      return Number(res.market.time / 1000n);
    }
    throw new Error("Market is not yet registered.");
  });

const getCachedMarketRegistrationMs = unstable_cache(
  getMarketRegistrationMs,
  ["market-registrations"],
  {
    revalidate: HISTORICAL_CACHE_DURATION,
  }
);

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
  const numParcels = parseInt(params.amount);

  const index = toIndex(to, period);

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

  let totalCount = 0;
  let i = 0;

  let registrationPeriodBoundaryStart: Date;
  try {
    registrationPeriodBoundaryStart = await getCachedMarketRegistrationMs(marketID).then(
      (time) => new Date(Number(getPeriodStartTimeFromTime(time, period)))
    );
  } catch {
    return new Response("Market has not been registered yet.", { status: 400 });
  }

  while (totalCount <= countBack) {
    const localIndex = index - i;
    const endDate = indexToParcelEndDate(localIndex, period);
    let res: GetCandlesticksResponse;
    if (endDate < processorTimestamp) {
      res = await getHistoricCachedCandlesticks({
        marketID,
        index: localIndex,
        period,
      });
    } else {
      res = await getNormalCachedCandlesticks({
        marketID,
        index: localIndex,
        period,
      });
    }

    if (i == 0) {
      const parsed = parseJSON<CandlesticksDataType>(res.data);
      const filtered = parsed.filter(
        (val) => val.periodicMetadata.startTime < BigInt(to) * 1_000_000n
      );
      totalCount += filtered.length;
      data = jsonStrAppend(data, stringifyJSON(filtered));
    } else {
      totalCount += res.count;
      data = jsonStrAppend(data, res.data);
    }
    if (endDate < registrationPeriodBoundaryStart) {
      break;
    }
    i++;
  }

  return new Response(data);
}
