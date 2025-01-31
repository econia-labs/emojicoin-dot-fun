import {
  type AnyNumberString,
  getPeriodStartTimeFromTime,
  isPeriod,
  type Period,
  PeriodDuration,
  periodEnumToRawDuration,
} from "@sdk/index";
import { isNumber } from "utils";
import { unstable_cache } from "next/cache";
import { getLatestProcessedEmojicoinTimestamp } from "@sdk/indexer-v2/queries/utils";
import { parseJSON, stringifyJSON } from "utils";
import { fetchMarketRegistration, fetchPeriodicEventsSince } from "@/queries/market";

/**
 * Parcel size is the amount of candlestick periods that will be in a single parcel.
 * That is, a parcel for 1m candlesticks will be `PARCEL_SIZE` minutes of time.
 *
 * Note that this is *NOT* the number of candlesticks in the database- as there may be gaps in the
 * on-chain data (and thus the database).
 *
 * More specifically, each parcel will have anywhere from 0 to PARCEL_SIZE number of candlesticks
 * and will always span `PARCEL_SIZE` candlesticks/periods worth of time.
 */
export const PARCEL_SIZE = 500;

export const indexToParcelStartDate = (index: number, period: Period): Date =>
  new Date((PARCEL_SIZE * (index * periodEnumToRawDuration(period))) / 1000);
export const indexToParcelEndDate = (index: number, period: Period): Date =>
  new Date((PARCEL_SIZE * ((index + 1) * periodEnumToRawDuration(period))) / 1000);

export const getPeriodDurationSeconds = (period: Period) =>
  (periodEnumToRawDuration(period) / PeriodDuration.PERIOD_1M) * 60;

export const toIndex = (end: number, period: Period): number => {
  const periodDuration = getPeriodDurationSeconds(period);
  const parcelDuration = periodDuration * PARCEL_SIZE;

  const index = Math.floor(end / parcelDuration);

  return index;
};

export const jsonStrAppend = (a: string, b: string): string => {
  if (a === "[]") return b;
  if (b === "[]") return a;
  return `${a.substring(0, a.length - 1)},${b.substring(1)}`;
};

export type GetCandlesticksParams = {
  marketID: number;
  index: number;
  period: Period;
};

/**
 * The search params used in the `GET` request at `candlesticks/api`.
 *
 * @property {string} marketID      - The market ID.
 * @property {string} to            - The end time boundary.
 * @property {string} period        - The {@link Period}.
 * @property {string} countBack     - The `countBack` value requested by the datafeed API.
 */
export type CandlesticksSearchParams = {
  marketID: string | null;
  to: string | null;
  period: string | null;
  countBack: string | null;
};

/**
 * Validated {@link CandlesticksSearchParams}.
 */
export type ValidCandlesticksSearchParams = {
  marketID: string;
  to: string;
  period: Period;
  amount: string;
  countBack: string;
};

export const isValidCandlesticksSearchParams = (
  params: CandlesticksSearchParams
): params is ValidCandlesticksSearchParams => {
  const { marketID, to, period, countBack } = params;
  // prettier-ignore
  return (
    marketID !== null && isNumber(marketID) &&
    to !== null && isNumber(to) &&
    countBack !== null && isNumber(countBack) &&
    period !== null && isPeriod(period)
  );
};

export const HISTORICAL_CACHE_DURATION = 60 * 60 * 24 * 365; // 1 year.
export const NORMAL_CACHE_DURATION = 10; // 10 seconds.

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

export const getCandlesticksRoute = async (
  marketID: number,
  to: number,
  period: Period,
  countBack: number
) => {
  const index = toIndex(to, period);

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
    throw new Error("Market has not been registered yet.");
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

  return data;
};
