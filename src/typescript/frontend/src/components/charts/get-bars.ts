import { type ArenaChartSymbol, hasTradingActivity, isArenaChartSymbol } from "lib/chart-utils";
import { ROUTES } from "router/routes";
import { fetchRateLimited } from "utils";

import type { Period, PeriodDuration } from "@/sdk/const";
import { getPeriodStartTimeFromTime } from "@/sdk/utils/misc";
import type { XOR } from "@/sdk/utils/utility-types";
import {
  convertToCandlestickModels,
  type Flatten,
  type HomogenousCandlesticksJson,
} from "@/sdk-types";
import type { PeriodParams } from "@/static/charting_library";
import type { BarWithNonce } from "@/store/event/candlestick-bars";
import { toBarWithNonce } from "@/store/event/candlestick-bars";

export const fetchCandlesticksForChart = async ({
  marketID,
  meleeID,
  periodParams,
  period,
}: Flatten<
  XOR<{ marketID: string }, { meleeID: string }> & {
    periodParams: PeriodParams;
    period: Period;
  }
>) => {
  const params = new URLSearchParams({
    ...(marketID !== undefined ? { marketID } : { meleeID }),
    period: period.toString(),
    countBack: periodParams.countBack.toString(),
    to: periodParams.to.toString(),
  });

  const route =
    marketID !== undefined ? ROUTES.api["candlesticks"] : ROUTES.api["arena"]["candlesticks"];

  return await fetchRateLimited<HomogenousCandlesticksJson>(`${route}?${params}`)
    .then(convertToCandlestickModels)
    .then((res) =>
      res
        .map(toBarWithNonce)
        .sort((a, b) => a.time - b.time)
        .reduce(curriedBarsReducer(periodParams.to), [])
    )
    .catch((error) => {
      console.error(`Couldn't fetch candlesticks from ${route}: ${error}`);
      return [] as BarWithNonce[];
    });
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
