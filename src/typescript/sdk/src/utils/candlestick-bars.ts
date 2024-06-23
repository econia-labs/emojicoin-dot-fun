/* eslint-disable import/no-unused-modules */
import { CandlestickResolution } from "../const";
import { Types } from "../types";
import { getPeriodBoundary } from "./misc";
import { q64ToBig } from "./nominal-price";

export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LatestBar = Bar & {
  periodBoundary: bigint;
  guids: Set<string>; // The guids of all swap events that have been recorded in the latest bar.
};

export const toBars = <T extends Types.PeriodicStateEvent | Types.PeriodicStateView>(
  events: T | T[]
) => (Array.isArray(events) ? events.map(toBar) : toBar(events));

/**
 * Converting from a periodic state event or view to a bar is simple, because they are essentially
 * the same thing just in different data formats. The data is already aggregated and formulated.
 *
 * This function is specifically for converting a single event or view to a TradingView chart bar.
 */
export const toBar = <T extends Types.PeriodicStateEvent | Types.PeriodicStateView>(
  event: T
): Bar => ({
  time: Number(getPeriodBoundary(event, event.periodicStateMetadata.period) / 1000n),
  open: q64ToBig(event.openPriceQ64).toNumber(),
  high: q64ToBig(event.highPriceQ64).toNumber(),
  low: q64ToBig(event.lowPriceQ64).toNumber(),
  close: q64ToBig(event.closePriceQ64).toNumber(),
  volume: Number(event.volumeQuote),
});

/**
 * When we don't have a bar for a resolution/period, we must make the LatestBar from a swap event.
 */
export const swapToNewLatestBar = (
  swap: Types.SwapEvent,
  period: CandlestickResolution
): LatestBar => {
  const price = q64ToBig(swap.avgExecutionPrice).toNumber();

  const periodBoundary = getPeriodBoundary(swap, period);
  const newPeriodBoundary = periodBoundary + BigInt(period);

  return {
    time: Number(newPeriodBoundary / 1000n),
    open: price,
    high: price,
    low: price,
    close: price,
    volume: Number(swap.baseVolume),
    periodBoundary: getPeriodBoundary(swap, period),
    guids: new Set([swap.guid]),
  };
};

/**
 * Creating a bar from an array of swaps is tricky in that we must not overwrite the time
 * value when adding new data to the candlestick bar, but we must record each bar's time
 * in order to accurately calculate the close price of the bar.
 */
export const createLatestBarFromSwaps = (
  swaps: Types.SwapEvent[],
  period: CandlestickResolution
): LatestBar => {
  if (swaps.length === 0) {
    throw new Error("Cannot create a bar from an empty array of swaps.");
  }
  // Sort and assert that the swaps are in descending order if in development mode.
  // TODO: Remove this once the chart component is stable.
  if (process.env.NODE_ENV === "development") {
    const copy = [...swaps];
    swaps.sort((a, b) => Number(a.time - b.time));
    swaps.reverse();
    for (let i = 0; i < swaps.length; i++) {
      if (swaps[i] !== copy[i]) {
        throw new Error("Swaps are not in ascending order.");
      }
    }
  }

  // Since we sorted in descending order, the first swap is the latest swap.
  // Thus we set the open here once and don't set it again.
  const initial = swaps.shift()!;
  const bar = swapToNewLatestBar(initial, period);
  const periodBoundaryInitial = bar.periodBoundary;

  // Filter out swaps that aren't within the first event's period boundary, since it is
  // the latest and we are only calculating the latest bar.
  const filtered = swaps.filter(
    (swap) => getPeriodBoundary(swap, period) === periodBoundaryInitial
  );

  for (const swap of filtered) {
    if (bar.guids.has(swap.guid)) {
      continue;
    }

    const price = q64ToBig(swap.avgExecutionPrice).toNumber();
    bar.high = Math.max(bar.high, price);
    bar.low = Math.min(bar.low, price);
    bar.volume += Number(swap.baseVolume);
    bar.guids.add(swap.guid);
  }

  // Set the close price to the last swap's price and time.
  const lastSwap = filtered.length !== 0 ? filtered.at(-1)! : initial;
  bar.close = q64ToBig(lastSwap.avgExecutionPrice).toNumber();

  return bar;
};

export const createNewLatestBar = (event: Types.PeriodicStateEvent): LatestBar => {
  // Set the new bar's open, high, low, and close to the close price of the event triggering
  // the creation of the new bar.
  const price = q64ToBig(event.closePriceQ64).toNumber();

  // Calculate the new period boundary for the new bar.
  const nextPeriodBoundary = getNextPeriodBoundary(event);

  return {
    time: Number(nextPeriodBoundary / 1000n),
    open: price,
    high: price,
    low: price,
    close: price,
    volume: 0,
    periodBoundary: nextPeriodBoundary,
    guids: new Set<string>(),
  };
};

export const getNextPeriodBoundary = (event: Types.PeriodicStateEvent): bigint =>
  getPeriodBoundary(event, event.periodicStateMetadata.period) + event.periodicStateMetadata.period;
