import { type Types } from "@sdk-types";
import { ONE_APT, type Period, periodEnumToRawDuration, rawPeriodToEnum } from "@sdk/const";
import { type SwapEventModel, type PeriodicStateEventModel } from "@sdk/indexer-v2/types";
import { getPeriodStartTimeFromTime } from "@sdk/utils";
import { q64ToBig } from "@sdk/utils/nominal-price";
import Big from "big.js";

export type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LatestBar = Bar & {
  period: Period;
  marketNonce: bigint;
};

export const periodicStateTrackerToLatestBar = (
  tracker: Types["PeriodicStateTracker"],
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
    period: rawPeriodToEnum(tracker.period),
    marketNonce,
  };
};

export const marketToLatestBars = <
  T extends {
    periodicStateTrackers: Types["MarketView"]["periodicStateTrackers"];
    sequenceInfo: Types["MarketView"]["sequenceInfo"];
  },
>(
  market: T
): LatestBar[] => {
  const { periodicStateTrackers, sequenceInfo } = market;
  const latestBars: LatestBar[] = [];
  for (const tracker of periodicStateTrackers) {
    const bar = periodicStateTrackerToLatestBar(tracker, sequenceInfo.nonce);
    latestBars.push(bar);
  }
  return latestBars;
};

export const toBar = (event: PeriodicStateEventModel): Bar => ({
  time: Number(event.periodicMetadata.startTime / 1000n),
  open: q64ToBig(event.periodicState.openPriceQ64).toNumber(),
  high: q64ToBig(event.periodicState.highPriceQ64).toNumber(),
  low: q64ToBig(event.periodicState.lowPriceQ64).toNumber(),
  close: q64ToBig(event.periodicState.closePriceQ64).toNumber(),
  volume: Number(event.periodicState.volumeQuote) / ONE_APT,
});

export const toBars = (events: PeriodicStateEventModel | PeriodicStateEventModel[]) =>
  Array.isArray(events) ? events.map(toBar) : toBar(events);

export const createBarFromSwap = (
  event: SwapEventModel,
  period: Period,
  previousClose?: number
): LatestBar => {
  const { swap, market } = event;
  const price = q64ToBig(swap.avgExecutionPriceQ64).toNumber();
  const periodStartTime = getPeriodStartTimeFromTime(market.time, period);
  return {
    time: Number(periodStartTime / 1000n),
    // Only use previousClose if it's a truthy value, otherwise, new bars that follow bars with no
    // trading activity will appear as a huge green candlestick because their open price is `0`.
    open: previousClose ? previousClose : price,
    high: price,
    low: price,
    close: price,
    volume: Number(swap.baseVolume),
    period,
    marketNonce: market.marketNonce,
  };
};

export const createBarFromPeriodicState = (
  event: PeriodicStateEventModel,
  previousClose?: number
): LatestBar => {
  const { market, periodicMetadata, periodicState } = event;
  const { period } = periodicMetadata;
  const price = q64ToBig(periodicState.closePriceQ64).toNumber();
  return {
    time: periodEnumToRawDuration(period) / 1000,
    // Only use previousClose if it's a truthy value, otherwise, new bars that follow bars with no
    // trading activity will appear as a huge green candlestick because their open price is `0`.
    open: previousClose ? previousClose : price,
    high: price,
    low: price,
    close: price,
    volume: 0,
    period,
    marketNonce: market.marketNonce,
  };
};
