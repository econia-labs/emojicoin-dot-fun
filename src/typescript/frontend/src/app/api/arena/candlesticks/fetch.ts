// cspell:word timespan

import { parseJSON, stringifyJSON } from "utils";
import { type ArenaCandlesticksSearchParams } from "./search-params-schema";
import {
  getCachedLatestProcessedEmojicoinTimestamp,
  getPeriodDurationSeconds,
  HISTORICAL_CACHE_DURATION,
  indexToParcelEndDate,
  indexToParcelStartDate,
  jsonStrAppend,
  NORMAL_CACHE_DURATION,
  PARCEL_SIZE,
  toIndex,
} from "app/api/candlesticks/utils";
import {
  type ArenaCandlestickModel,
  fetchArenaCandlesticksSince,
  fetchArenaInfoByMeleeID,
} from "@sdk/indexer-v2";
import { type AnyNumberString } from "@sdk-types";
import { unstable_cache } from "next/cache";
import { type ArenaPeriod } from "@sdk/const";
import { getPeriodStartTimeFromTime } from "@sdk/utils/misc";

const getCandlesticks = async (
  params: Pick<ArenaCandlesticksSearchParams, "meleeID" | "period"> & { index: number }
) => {
  const { meleeID, period, index } = params;
  const start = indexToParcelStartDate(index, period);
  const periodDurationMilliseconds = getPeriodDurationSeconds(period) * 1000;
  const timespan = periodDurationMilliseconds * PARCEL_SIZE;
  const end = new Date(start.getTime() + timespan);

  // PARCEL_SIZE determines the max number of rows, so we don't need to pass a `LIMIT` value.
  // `start` and `end` determine the level of pagination, so no need to specify `offset` either.
  const data = await fetchArenaCandlesticksSince({
    meleeID,
    period,
    start,
    end,
  });

  return {
    data: stringifyJSON(data),
    count: data.length,
  };
};

const MELEE_START_TIMES_TAG = "melee-start-times" as const;
/**
 * In case the nextjs cache is poisoned (by fetching candlestick data for a melee that doesn't exist
 * yet), return a unique time very far in the future to indicate that a response is invalid and thus
 * should be ignored when returned from the cached fetch response.
 *
 * There is no clear way to circumvent this issue- it is a limitation of `unstable_cache`, and
 * `revalidateTag` is not clear or worth the time to figure out properly.
 */
const START_TIME_IF_FAILURE = 777777777777777 as const; // new Date(777...777) === year ~22,600.

const getMeleeStartMs = async (meleeID: AnyNumberString) =>
  fetchArenaInfoByMeleeID({ meleeID }).then((res) => {
    if (res) {
      return res.startTime.getTime();
    }
    return START_TIME_IF_FAILURE;
  });

const getCachedMeleeStartMs = unstable_cache(getMeleeStartMs, [MELEE_START_TIMES_TAG], {
  revalidate: HISTORICAL_CACHE_DURATION,
});

/**
 * A function that handles getting the melee start period boundary.
 *
 * If the cache for the melee `start_time` was poisoned or the meleeID data was simply queried
 * before it was started, we unfortunately have to always skip the cache and force fetch the data.
 * @see {@link START_TIME_IF_FAILURE}
 */
const getMeleeStartPeriodBoundary = (meleeID: AnyNumberString, period: ArenaPeriod) =>
  getCachedMeleeStartMs(meleeID)
    .then(async (time) => {
      if (time === START_TIME_IF_FAILURE) {
        return await getMeleeStartMs(meleeID);
      }
      return time;
    })
    .then((validTime) => new Date(Number(getPeriodStartTimeFromTime(validTime, period))));

const getHistoricCachedCandlesticks = unstable_cache(
  getCandlesticks,
  ["arena-candlesticks-historic"],
  {
    revalidate: HISTORICAL_CACHE_DURATION,
  }
);

const getNormalCachedCandlesticks = unstable_cache(getCandlesticks, ["arena-candlesticks"], {
  revalidate: NORMAL_CACHE_DURATION,
});

/**
 * This implementation and all utility functions imported from "utils" are essentially copied over
 * from {@link [/api/candlesticks](../../candlesticks/utils.ts)}.
 */
export const fetchArenaCandlesticksRoute = async (args: ArenaCandlesticksSearchParams) => {
  const { meleeID, to, period, countBack } = args;
  const index = toIndex(to, period);

  let data: string = "[]";
  const processorTimestamp = new Date(await getCachedLatestProcessedEmojicoinTimestamp());
  let totalCount = 0;
  let i = 0;

  const meleeStartPeriodBoundary = await getMeleeStartPeriodBoundary(meleeID, period);

  while (totalCount <= countBack) {
    const localIndex = index - i;
    const endDate = indexToParcelEndDate(localIndex, period);
    const query =
      endDate < processorTimestamp ? getHistoricCachedCandlesticks : getNormalCachedCandlesticks;
    const res = await query({ meleeID, index: localIndex, period });

    if (i === 0) {
      const parsed = parseJSON<ArenaCandlestickModel[]>(res.data);
      const filtered = parsed.filter((val) => val.startTime.getTime() < to * 1000);
      totalCount += filtered.length;
      data = jsonStrAppend(data, stringifyJSON(filtered));
    } else {
      totalCount += res.count;
      data = jsonStrAppend(data, res.data);
    }
    if (endDate < meleeStartPeriodBoundary) {
      break;
    }
    i += 1;
  }

  return data;
};
