import { type ArenaChartSymbol, hasTradingActivity, isArenaChartSymbol } from "lib/chart-utils";
import { ROUTES } from "router/routes";
import { fetchRateLimited, parseResponseJSON } from "utils";

import type { Period, PeriodDuration } from "@/sdk/const";
import type { DatabaseJsonType, LatestMarketCandlesticks } from "@/sdk/index";
import { getPeriodStartTimeFromTime } from "@/sdk/utils/misc";
import type {
  HomogenousCandlestickModels,
  HomogenousCandlesticksJson,
  LatestArenaCandlesticks,
} from "@/sdk/utils/to-latest-candlesticks";
import {
  convertToCandlestickModels,
  toLatestArenaCandlesticksModel,
  toLatestMarketCandlesticksModel,
} from "@/sdk/utils/to-latest-candlesticks";
import type { XOR } from "@/sdk/utils/utility-types";
import type { Flatten } from "@/sdk-types";
import type { PeriodParams } from "@/static/charting_library";
import type { BarWithNonce } from "@/store/event/candlestick-bars";
import { toBarWithNonce } from "@/store/event/candlestick-bars";

const fetchLatestCandlesticks = async ({
  marketID,
  meleeID,
}: XOR<{ marketID: string }, { meleeID: string }>) => {
  const params = new URLSearchParams({
    ...(marketID !== undefined ? { marketID } : { meleeID }),
  });

  const route =
    marketID !== undefined
      ? ROUTES.api["latest-candlesticks"]
      : ROUTES.api["arena"]["latest-candlesticks"];

  return await fetch(`${route}?${params}`)
    .then((res) => res.text())
    .then((res) =>
      meleeID
        ? toLatestArenaCandlesticksModel(
            parseResponseJSON<LatestArenaCandlesticks<DatabaseJsonType["arena_candlesticks"]>>(res)
          )
        : toLatestMarketCandlesticksModel(
            parseResponseJSON<LatestMarketCandlesticks<DatabaseJsonType["candlesticks"]>>(res)
          )
    )
    .catch((e) => {
      console.error(e);
      return null;
    });
};

export const fetchCandlesticksForChart = async ({
  marketID,
  meleeID,
  periodParams,
  period,
  firstDataRequest,
}: Flatten<
  XOR<{ marketID: string }, { meleeID: string }> & {
    periodParams: PeriodParams;
    period: Period;
    firstDataRequest: boolean;
  }
>) => {
  const id = { ...(marketID !== undefined ? { marketID } : { meleeID }) };
  const params = new URLSearchParams({
    ...id,
    period: period.toString(),
    countBack: periodParams.countBack.toString(),
    to: periodParams.to.toString(),
  });

  const route =
    marketID !== undefined ? ROUTES.api["candlesticks"] : ROUTES.api["arena"]["candlesticks"];

  const candlesticksPromise = await fetchRateLimited<HomogenousCandlesticksJson>(
    `${route}?${params}`
  )
    .then(convertToCandlestickModels)
    .catch((error) => {
      console.error(`Couldn't fetch candlesticks from ${route}: ${error}`);
      return [] as HomogenousCandlestickModels;
    });
  const latestPromise = firstDataRequest
    ? fetchLatestCandlesticks(id).then((res) =>
        res && period in res ? res[period as keyof typeof res] : null
      )
    : Promise.resolve(null);

  // There's not really a clear way to name the variables below, so to clarify:
  // `lastCandlestick` is the last candlestick in `fetchRateLimited`.
  // `latest` is the period-specific, latest candlestick returned by `fetchLatestCandlesticks`.
  const [candlesticks, latest] = await Promise.all([candlesticksPromise, latestPromise]);

  // Combine the fetched array of candlesticks with the latest one returned by the individually
  // fetched latest candlesticks for each period.
  // Since they may overlap, deduplicate candlesticks and ensure that the individual latest
  // candlestick occurs later in time than the last candlestick in `candlesticks`.
  //
  // In summary, the contingencies below:
  // 1. The latest candlestick wasn't returned or it didn't occur later than the last candlestick
  //    in `candlesticks`, thus, just return `candlesticks` and ignore `latest`.
  // 2. The last candlestick in `candlesticks` and the `latest` candlestick represent the same bar.
  //    Since it's confirmed in contingency 1. that `latest` occurs later, it must be true that if
  //    they represent the same bar, the `latest` candlestick is the one that should be used. Then,
  //    remove the other one with `.slice(0, -1)`.
  // 3. There is no overlap, so simply concatenate the arrays with `latest` at the very end.
  const lastCandlestick = candlesticks.at(-1);
  const latestBarIsInvalid = !latest || latest.version < (lastCandlestick?.version ?? 0n);
  const candlesticksWithLatestBar = latestBarIsInvalid
    ? candlesticks
    : lastCandlestick?.startTime.getTime() === latest.startTime.getTime()
      ? [...candlesticks.slice(0, -1), latest]
      : [...candlesticks, latest];

  // Then, perform the reducer and ensure that if a latest candlestick was added to the base
  // `candlesticks` fetched, it will have a corrected open price based on the previous candlestick.
  return candlesticksWithLatestBar
    .map(toBarWithNonce)
    .sort((a, b) => a.time - b.time)
    .reduce(curriedBarsReducer(periodParams.to), []);
};

/**
 * The curried reducer function to filter and update all bar data.
 * - Filter the data so that all resulting bars are within the specified time range.
 * - Update the `open` price to the previous bar's `close` price if it exists.
 *
 * Only exclude bars that are after `to`.
 * @see {@link https://www.tradingview.com/charting-library-docs/latest/connecting_data/datafeed-api/required-methods#getbars}
 *
 * NOTE: Since `getBars` is called multiple times, this may result in minor visual inconsistencies
 * where the first bar for each `getBars` call has an incorrect `open` value.
 * @param acc
 * @param event
 * @returns
 */
function curriedBarsReducer(
  to: number
): (acc: BarWithNonce[], bar: BarWithNonce) => BarWithNonce[] {
  return (acc, bar) => {
    const inTimeRange = bar.time <= to * 1000;
    if (inTimeRange && hasTradingActivity(bar)) {
      const prev = acc.at(-1);
      if (prev) {
        bar.open = prev.close;
      }
      acc.push(bar);
    }
    return acc;
  };
}

export const createDummyBar = (
  periodDuration: PeriodDuration,
  symbol: string | ArenaChartSymbol
) => {
  const time = BigInt(new Date().getTime()) * 1000n;
  const timeAsPeriod = getPeriodStartTimeFromTime(time, periodDuration) / 1000n;
  // If the chart consists of two symbols (like for arena), we want to show a default ratio of 1
  // instead, because the prices are equally 0.
  const defaultValue = isArenaChartSymbol(symbol) ? 1 : 0;
  return {
    time: Number(timeAsPeriod.toString()),
    open: defaultValue,
    high: defaultValue,
    low: defaultValue,
    close: defaultValue,
    volume: 0,
    nonce: 0n,
  };
};
