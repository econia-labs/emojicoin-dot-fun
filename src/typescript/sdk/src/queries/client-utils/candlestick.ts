/* eslint-disable import/no-unused-modules */ // Still this bug where it thinks this doesn't export.
import { CandlestickResolution } from "../../const";
import { type Types } from "../../types";

/**
 * Tip: Use the CandlestickResolution enum to access the keys of an object of this type.
 *
 * @example
 * const candlesticks = await getInitialCandlesticks(marketID);
 * const oneDayCandlesticks = candlesticks[CandlestickResolution.PERIOD_1D];
 * const oneHourCandlesticks = candlesticks[CandlestickResolution.PERIOD_1H];
 * const oneMinuteCandlesticks = candlesticks[CandlestickResolution.PERIOD_1M];
 */
export type GroupedPeriodicStateEvents = Record<CandlestickResolution, Types.PeriodicStateEvent[]>;

export const getEmptyGroupedCandlesticks = (): GroupedPeriodicStateEvents => ({
  [CandlestickResolution.PERIOD_1M]: [],
  [CandlestickResolution.PERIOD_5M]: [],
  [CandlestickResolution.PERIOD_15M]: [],
  [CandlestickResolution.PERIOD_30M]: [],
  [CandlestickResolution.PERIOD_1H]: [],
  [CandlestickResolution.PERIOD_4H]: [],
  [CandlestickResolution.PERIOD_1D]: [],
});

// TODO: Put this in the event store...?
/**
 * @see {@link GroupedPeriodicStateEvents}
 */
export const toGroupedCandlesticks = (candlesticks: Types.PeriodicStateEvent[]) => {
  const grouped = getEmptyGroupedCandlesticks();

  for (const candlestick of candlesticks) {
    const periodInEvent = Number(candlestick.periodicStateMetadata.period) as CandlestickResolution;
    grouped[periodInEvent].push(candlestick);
  }

  return grouped;
};
