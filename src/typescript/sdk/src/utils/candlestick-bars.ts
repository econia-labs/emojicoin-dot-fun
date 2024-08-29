/* eslint-disable import/no-unused-modules */
import Big from "big.js";
import { type Types } from "../types";
import { getPeriodStartTime } from "./misc";
import { q64ToBig } from "./nominal-price";
import { type ContractPeriod } from "../const";

export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LatestBar = Bar & {
  period: ContractPeriod;
  marketNonce: bigint;
};

/**
 * Converting from a periodic state event or view to a bar is simple, because they are essentially
 * the same thing just in different data formats. The data is already aggregated and formulated.
 *
 * This function is specifically for converting a single event or view to a TradingView chart bar.
 */
export const toBar = <T extends Types.PeriodicStateEvent | Types.PeriodicStateView>(
  event: T
): Bar => ({
  time: Number(getPeriodStartTime(event, event.periodicStateMetadata.period) / 1000n),
  open: q64ToBig(event.openPriceQ64).toNumber(),
  high: q64ToBig(event.highPriceQ64).toNumber(),
  low: q64ToBig(event.lowPriceQ64).toNumber(),
  close: q64ToBig(event.closePriceQ64).toNumber(),
  volume: Number(event.volumeQuote),
});

export const toBars = <T extends Types.PeriodicStateEvent | Types.PeriodicStateView>(
  events: T | T[]
) => (Array.isArray(events) ? events.map(toBar) : toBar(events));

export const createNewLatestBarFromSwap = (
  swap: Types.SwapEvent,
  resolution: ContractPeriod,
  previousClose?: number
): LatestBar => {
  // Set the new bar's open, high, low, and close to the close price of the event triggering
  // the creation of the new bar.
  const price = q64ToBig(swap.avgExecutionPriceQ64).toNumber();
  const periodStartTime = getPeriodStartTime(swap, resolution);

  return {
    time: Number(periodStartTime / 1000n),
    open: previousClose ?? price,
    high: price,
    low: price,
    close: price,
    volume: Number(swap.baseVolume),
    period: resolution,
    marketNonce: swap.marketNonce,
  };
};

export const createNewLatestBar = (
  event: Types.PeriodicStateEvent,
  previousClose?: number
): LatestBar => {
  // Set the new bar's open, high, low, and close to the close price of the event triggering
  // the creation of the new bar.
  const price = q64ToBig(event.closePriceQ64).toNumber();

  return {
    time: Number(event.periodicStateMetadata.period / 1000n),
    open: previousClose ?? price,
    high: price,
    low: price,
    close: price,
    volume: 0,
    period: Number(event.periodicStateMetadata.period),
    marketNonce: event.periodicStateMetadata.emitMarketNonce,
  };
};

export const periodicStateTrackerToLatestBar = (
  tracker: Types.PeriodicStateTracker,
  marketNonce: bigint
): LatestBar => {
  const { startTime } = tracker;
  return {
    time: Big(startTime.toString()).div(1000).toNumber(),
    open: q64ToBig(tracker.openPriceQ64).toNumber(),
    high: q64ToBig(tracker.highPriceQ64).toNumber(),
    low: q64ToBig(tracker.lowPriceQ64).toNumber(),
    close: q64ToBig(tracker.closePriceQ64).toNumber(),
    volume: Number(tracker.volumeBase),
    period: Number(tracker.period),
    marketNonce,
  };
};

export const marketViewToLatestBars = (marketView: Types.MarketView): LatestBar[] => {
  const latestBars: LatestBar[] = [];
  for (const tracker of marketView.periodicStateTrackers) {
    const bar = periodicStateTrackerToLatestBar(tracker, marketView.sequenceInfo.nonce);
    latestBars.push(bar);
  }
  return latestBars;
};
