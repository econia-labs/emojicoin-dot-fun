import {
  type LatestBar,
  marketToLatestBars,
  periodicStateTrackerToLatestBar,
  toBar,
} from "@/store/event/candlestick-bars";
import { type Types } from "@sdk-types";
import { Trigger, type Period, periodEnumToRawDuration, type PeriodDuration } from "@sdk/const";
import { toMarketEmojiData } from "@sdk/emoji_data/utils";
import { type MarketMetadataModel, type PeriodicStateEventModel } from "@sdk/indexer-v2";
import { getMarketResource } from "@sdk/markets/utils";
import { getAptosClient } from "@sdk/utils/aptos-client";
import { getPeriodStartTimeFromTime } from "@sdk/utils/misc";
import { type Bar, type PeriodParams } from "@static/charting_library";
import { hasTradingActivity } from "lib/chart-utils";
import { parseJSON } from "utils";

export const fetchCandlesticksForChart = async ({
  marketID,
  periodParams,
  period,
}: {
  marketID: string;
  periodParams: PeriodParams;
  period: Period;
}): Promise<Bar[]> => {
  const { to, countBack } = periodParams;
  const params = new URLSearchParams({
    marketID,
    period: period.toString(),
    countBack: countBack.toString(),
    to: to.toString(),
  });
  return await fetch(`/candlesticks?${params.toString()}`)
    .then((res) => res.text())
    .then((res) => parseJSON<PeriodicStateEventModel[]>(res))
    .then((res) =>
      res
        .sort((a, b) => Number(a.periodicMetadata.startTime - b.periodicMetadata.startTime))
        .map(toBar)
        .reduce(curriedBarsReducer(to), [])
    );
};

/**
 * The curried reducer function to filter and update all bar data.
 *
 * - Filter the data so that all resulting bars are within the specified time range.
 * - Update the `open` price to the previous bar's `close` price if it exists.
 *
 * Only exclude bars that are after `to`.
 * @see {@link https://www.tradingview.com/charting-library-docs/latest/connecting_data/datafeed-api/required-methods#getbars}
 *
 * NOTE: Since `getBars` is called multiple times, this will result in several
 * bars having incorrect `open` values. This isn't a big deal but may result in
 * some visual inconsistencies in the chart.
 * @param acc
 * @param event
 * @returns
 */
const curriedBarsReducer = (to: number) => (acc: Bar[], bar: Bar) => {
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

/**
 * Push the latest bar (the on-chain bar) to the bars array if it exists and update its `open` value
 * to be the previous bar's `close` if it's not the first/only bar.
 *
 * This logic mirrors what we use in `createBarFrom[Swap|PeriodicState]` but we need it here because
 * we need to update the latest bar based on the market view for the last call of `getBars`, not
 * just when a new event comes in.
 */
export const updateLastTwoBars = (bars: Bar[], onChainLatest: Bar) => {
  const emittedLatest = bars.at(-1);
  if (emittedLatest) {
    // If the latest bar has no trading activity, set all of its fields to the previous bar's close.
    if (!hasTradingActivity(onChainLatest)) {
      onChainLatest.high = emittedLatest.close;
      onChainLatest.low = emittedLatest.close;
      onChainLatest.close = emittedLatest.close;
    }
    if (emittedLatest.close !== 0) {
      onChainLatest.open = emittedLatest.close;
    } else {
      onChainLatest.open = onChainLatest.close;
    }
  }
  bars.push(onChainLatest);
};

/**
 * Utility function to create a dummy bar from the period duration when there's zero trading
 * activity for a market thus far.
 */
export const createDummyBar = (periodDuration: PeriodDuration) => {
  const time = BigInt(new Date().getTime()) * 1000n;
  const timeAsPeriod = getPeriodStartTimeFromTime(time, periodDuration) / 1000n;
  return {
    time: Number(timeAsPeriod.toString()),
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
  };
};

export const fetchLatestBarsFromMarketResource = async ({
  marketAddress,
  period,
}: {
  marketAddress: `0x${string}`;
  period: Period;
}): Promise<{
  marketMetadata: MarketMetadataModel;
  latestBar: LatestBar | undefined;
  latestBars: LatestBar[];
}> => {
  // Fetch the current candlestick data from the Aptos fullnode. This fetch call should *never* be cached.
  // Also, we specifically call this client-side because the server will get rate-limited if we call the
  // fullnode from the server for each client.
  const marketResource = await getMarketResource({
    aptos: getAptosClient(),
    marketAddress,
  });

  // Convert the market view data to `latestBar[]` and set the latest bars in our EventStore to those values.
  const latestBars = marketToLatestBars(marketResource);
  const marketMetadata = marketResourceToMarketMetadataModel(marketResource);
  const latestBar = getLatestBarFromTracker(marketResource, period);

  return {
    marketMetadata,
    latestBar,
    latestBars,
  };
};

const getLatestBarFromTracker = (marketResource: Types["Market"], period: Period) => {
  const periodDuration = periodEnumToRawDuration(period);
  // Get the period-specific state tracker for the current resolution/period type.
  const tracker = marketResource.periodicStateTrackers.find(
    (p) => Number(p.period) === periodDuration
  );
  if (!tracker) {
    return undefined;
  }
  const nonce = marketResource.sequenceInfo.nonce;
  return periodicStateTrackerToLatestBar(tracker, nonce);
};

const marketResourceToMarketMetadataModel = (market: Types["Market"]): MarketMetadataModel => ({
  marketID: market.metadata.marketID,
  time: 0n,
  marketNonce: market.sequenceInfo.nonce,
  // Make up some bunk trigger, since it should be clear it's made up.
  trigger: Trigger.PackagePublication,
  marketAddress: market.metadata.marketAddress,
  ...toMarketEmojiData(market.metadata.emojiBytes),
});
