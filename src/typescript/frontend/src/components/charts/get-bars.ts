import {
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
import { ROUTES } from "router/routes";
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
  const params = new URLSearchParams({
    marketID,
    period: period.toString(),
    countBack: periodParams.countBack.toString(),
    to: periodParams.to.toString(),
  });
  return await fetch(`${ROUTES.api.candlesticks}?${params.toString()}`)
    .then((res) => res.text())
    .then((res) => parseJSON<PeriodicStateEventModel[]>(res))
    .then((res) =>
      res
        .sort((a, b) => Number(a.periodicMetadata.startTime - b.periodicMetadata.startTime))
        .map(toBar)
        .reduce(curriedBarsReducer(periodParams.to), [])
    );
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
 * to be the previous bar's `close` if it's not the only bar.
 *
 * This logic is very similar to what's used in `createBarFrom[Swap|PeriodicState]`.
 */
export const updateLastTwoBars = (bars: Bar[], onChainLatest: Bar) => {
  const emittedLatest = bars.at(-1);
  if (emittedLatest) {
    if (!hasTradingActivity(onChainLatest)) {
      onChainLatest.high = emittedLatest.close;
      onChainLatest.low = emittedLatest.close;
      onChainLatest.close = emittedLatest.close;
    }
    onChainLatest.open = emittedLatest.close !== 0 ? emittedLatest.close : onChainLatest.close;
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

/**
 * Make an uncached client-side fetch for the current market resource from the Aptos fullnode.
 */
export const fetchLatestBarsFromMarketResource = async ({
  marketAddress,
  period,
}: {
  marketAddress: `0x${string}`;
  period: Period;
}) => {
  const marketResource = await getMarketResource({ aptos: getAptosClient(), marketAddress });
  return {
    marketMetadata: marketResourceToMarketMetadataModel(marketResource),
    latestBar: getLatestBarFromTracker(marketResource, period),
    latestBars: marketToLatestBars(marketResource),
  };
};

const getLatestBarFromTracker = (marketResource: Types["Market"], period: Period) => {
  const periodDuration = periodEnumToRawDuration(period);
  const { periodicStateTrackers, sequenceInfo } = marketResource;
  const tracker = periodicStateTrackers.find((p) => Number(p.period) === periodDuration);
  if (!tracker) return undefined;
  return periodicStateTrackerToLatestBar(tracker, sequenceInfo.nonce);
};

const marketResourceToMarketMetadataModel = (market: Types["Market"]): MarketMetadataModel => ({
  marketID: market.metadata.marketID,
  time: 0n,
  marketNonce: market.sequenceInfo.nonce,
  trigger: Trigger.PackagePublication, // Make up a bunk trigger, since this field won't be used.
  marketAddress: market.metadata.marketAddress,
  ...toMarketEmojiData(market.metadata.emojiBytes),
});
