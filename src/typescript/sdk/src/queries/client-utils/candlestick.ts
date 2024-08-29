/* eslint-disable import/no-unused-modules */ // Still this bug where it thinks this doesn't export.
import { ContractPeriod } from "../../const";
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
export type GroupedPeriodicStateEvents = Record<ContractPeriod, Types.PeriodicStateEvent[]>;

export const createEmptyGroupedCandlesticks = (): GroupedPeriodicStateEvents => ({
  [ContractPeriod.PERIOD_1M]: [],
  [ContractPeriod.PERIOD_5M]: [],
  [ContractPeriod.PERIOD_15M]: [],
  [ContractPeriod.PERIOD_30M]: [],
  [ContractPeriod.PERIOD_1H]: [],
  [ContractPeriod.PERIOD_4H]: [],
  [ContractPeriod.PERIOD_1D]: [],
});

// TODO: Put this in the event store...?
/**
 * @see {@link GroupedPeriodicStateEvents}
 */
export const toGroupedCandlesticks = (candlesticks: Types.PeriodicStateEvent[]) => {
  const grouped = createEmptyGroupedCandlesticks();

  for (const candlestick of candlesticks) {
    const periodInEvent = Number(candlestick.periodicStateMetadata.period) as ContractPeriod;
    grouped[periodInEvent].push(candlestick);
  }

  return grouped;
};

export const isGroupedCandlesticks = (
  candlesticks: any
): candlesticks is GroupedPeriodicStateEvents =>
  Object.keys(candlesticks).every((key) => Object.values(ContractPeriod).includes(key as any));
