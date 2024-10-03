/* eslint-disable import/no-unused-modules */ // Still this bug where it thinks this doesn't export.
import { PeriodDuration } from "../../const";
import { type Types } from "../../types";

/**
 * Tip: Use the PeriodDuration enum to access the keys of an object of this type.
 *
 * @example
 * const candlesticks = await getInitialCandlesticks(marketID);
 * const oneDayCandlesticks = candlesticks[PeriodDuration.PERIOD_1D];
 * const oneHourCandlesticks = candlesticks[PeriodDuration.PERIOD_1H];
 * const oneMinuteCandlesticks = candlesticks[PeriodDuration.PERIOD_1M];
 */
export type GroupedPeriodicStateEvents = Record<PeriodDuration, Types["PeriodicStateEvent"][]>;

export const createEmptyGroupedCandlesticks = (): GroupedPeriodicStateEvents => ({
  [PeriodDuration.PERIOD_1M]: [],
  [PeriodDuration.PERIOD_5M]: [],
  [PeriodDuration.PERIOD_15M]: [],
  [PeriodDuration.PERIOD_30M]: [],
  [PeriodDuration.PERIOD_1H]: [],
  [PeriodDuration.PERIOD_4H]: [],
  [PeriodDuration.PERIOD_1D]: [],
});

// TODO: Put this in the event store...?
/**
 * @see {@link GroupedPeriodicStateEvents}
 */
export const toGroupedCandlesticks = (candlesticks: Types["PeriodicStateEvent"][]) => {
  const grouped = createEmptyGroupedCandlesticks();

  for (const candlestick of candlesticks) {
    const periodInEvent = Number(candlestick.periodicStateMetadata.period) as PeriodDuration;
    grouped[periodInEvent].push(candlestick);
  }

  return grouped;
};
