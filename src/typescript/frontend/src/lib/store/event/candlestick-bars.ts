import { type AnyPeriod, type Period, periodEnumToRawDuration, rawPeriodToEnum } from "@sdk/const";
import {
  type ArenaCandlestickModel,
  isPeriodicStateEventModel,
  type PeriodicStateEventModel,
  type SwapEventModel,
} from "@sdk/indexer-v2/types";
import { getPeriodStartTimeFromTime, toNominal } from "@sdk/utils";
import { q64ToBig } from "@sdk/utils/nominal-price";
import type { Types } from "@sdk-types";
import Big from "big.js";

type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type LatestBar = Bar & {
  period: AnyPeriod;
  nonce: bigint;
};

export const periodicStateTrackerToLatestBar = (
  tracker: Types["PeriodicStateTracker"],
  nonce: bigint
): LatestBar => {
  const { startTime } = tracker;
  return {
    time: Big(startTime.toString()).div(1000).toNumber(),
    open: q64ToBig(tracker.openPriceQ64).toNumber(),
    high: q64ToBig(tracker.highPriceQ64).toNumber(),
    low: q64ToBig(tracker.lowPriceQ64).toNumber(),
    close: q64ToBig(tracker.closePriceQ64).toNumber(),
    volume: toNominal(tracker.volumeQuote),
    period: rawPeriodToEnum(tracker.period),
    nonce,
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

export function toBar(event: PeriodicStateEventModel | ArenaCandlestickModel): Bar {
  return isPeriodicStateEventModel(event)
    ? {
        time: Number(event.periodicMetadata.startTime / 1000n),
        open: q64ToBig(event.periodicState.openPriceQ64).toNumber(),
        high: q64ToBig(event.periodicState.highPriceQ64).toNumber(),
        low: q64ToBig(event.periodicState.lowPriceQ64).toNumber(),
        close: q64ToBig(event.periodicState.closePriceQ64).toNumber(),
        volume: toNominal(event.periodicState.volumeQuote),
      }
    : {
        time: event.startTime.getTime(),
        open: event.openPrice,
        high: event.highPrice,
        low: event.lowPrice,
        close: event.closePrice,
        volume: toNominal(event.volume),
      };
}

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
    volume: toNominal(swap.quoteVolume),
    period,
    nonce: market.marketNonce,
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
    nonce: market.marketNonce,
  };
};
