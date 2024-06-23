"use server";

import { CandlestickResolution, EMOJICOIN_DOT_FUN_MODULE_NAME } from "../const";
import { INBOX_EVENTS_TABLE, LIMIT, ORDER_BY, PERIODIC_STATE_VIEW } from "./const";
import { getPeriodBoundaryFromTime } from "../utils";
import { wrap } from "./utils";
import { type Types, toPeriodicStateView, type JSONTypes, toSwapEvent } from "../types";
import {
  type AggregateQueryResultsArgs,
  aggregateQueryResults,
  InnerPostgrestResponse,
  hasJSONData,
} from "./query-helper";
import { postgrest } from "./inbox-url";
import { type ValueOf } from "../utils/utility-types";
import { LatestBar } from "../utils/candlestick-bars";

export type SharedCandlestickQueryArgs = {
  marketID: bigint | number | string;
  resolution: CandlestickResolution;
  limit?: number;
};

export type CandlestickByTimeRangeQueryArgs = SharedCandlestickQueryArgs & {
  start: Date;
  end: Date;
  offset: number;
  orderBy?: ValueOf<typeof ORDER_BY>;
};

/**
 * Aggregates all swap events for a given market and resolution and calculates the OHLCV values.
 * If `lastClose` is passed in, this value is used to calculate the initial opening value of the
 * candlestick bar.
 *
 * Since we calculate this value for all candlestick resolutions (aka periods), we can fetch the
 * values for the largest period and then calculate the values for the smaller periods given
 * the larger period's data- since the smaller periods will always be a subset of the larger period.
 *
 * TODO: Consider caching this data by fetching with `unstable_cache` and revalidating when
 * there are new swap events within the last day (or whatever the largest resolution is).
 *
 * @param marketID the market ID
 * @param resolution the resolution of the candlestick
 * @param lastClose the closing price of the previous latest bar- used to calculate OHLC for the new
 * latest bar, otherwise uses the first swap event in the period.
 */
export const fetchLatestBars = async ({
  marketID,
  resolutions,
  lastClose,
}: {
  marketID: bigint | number | string;
  resolutions: Array<CandlestickResolution>;
  lastClose?: bigint;
}) => {
  const now = BigInt(new Date().getTime() * 1000);
  const time = BigInt(now);
  // For when we need to filter based on each candlestick resolution's period boundary.
  const boundaries = new Map<CandlestickResolution, number>([]);
  for (const res of resolutions) {
    const boundary = getPeriodBoundaryFromTime(time, res);
    boundaries.set(res, boundary);
  }

  // In order to get the latest bar for a resolution, we calculate the period boundary with respect
  // to the current time. This gives us a window of time that the latest bar should be in.
  // Then we fetch all swap events in that window and calculate the OHLCV values.
  const largestResolution = resolutions.sort((a, b) => b - a)[0];
  const largestBoundary = boundaries.get(largestResolution)!;
  const start = largestBoundary;

  const swaps = new Array<Types.SwapEvent>();
  let offset = 0;
  let limit = LIMIT;
  let shouldContinue = true;

  // Fetch all the data for the largest resolution.
  while (shouldContinue) {
    const { events } = await postgrest
      .from(INBOX_EVENTS_TABLE)
      .select("*")
      .eq("data->>market_id", marketID.toString())
      .eq("event_name", `${EMOJICOIN_DOT_FUN_MODULE_NAME}::Swap`)
      .range(offset, offset + limit - 1)
      .order("transaction_version", ORDER_BY.DESC)
      .limit(limit)
      .then((res) => ({
        events: (res.data ?? []) as InnerPostgrestResponse<JSONTypes.SwapEvent>,
        error: res.error,
      }));

    swaps.push(
      ...events.map((e) => {
        if (!hasJSONData(e)) {
          throw new Error("Expected JSON data in swap event");
        }
        return toSwapEvent(e.data, e.transaction_version);
      })
    );

    // When the least recent swap event is older than the start time or when the number of swaps
    // returned is less than the limit, we stop fetching.
    const oldestSwap = swaps.at(-1);
    shouldContinue =
    events.length === limit && typeof oldestSwap !== "undefined" && oldestSwap.time >= start;
    offset += limit;
  }

  console.log(swaps.length);

  // The previous bar is either the bar data passed in from a periodic state event or from the
  // first swap in the data set.
  const lastSwapAvgPrice = swaps.at(-1)?.avgExecutionPrice ?? 0n;
  // The common fields for all resolutions.
  const previousBar: Omit<LatestBar, "time" | "periodBoundary" | "guids"> = {
    open: Number(lastClose ?? lastSwapAvgPrice),
    high: Number(lastClose ?? lastSwapAvgPrice),
    low: Number(lastClose ?? lastSwapAvgPrice),
    close: Number(lastClose ?? lastSwapAvgPrice),
    volume: 0,
  };

  const latestBars = new Map<CandlestickResolution, LatestBar>();
  // Set the latest bar for each resolution.
  for (const resolution of resolutions) {
    latestBars.set(resolution, {
      ...previousBar,
      guids: new Set<string>(),
      time: boundaries.get(resolution)! / 1000,
      periodBoundary: BigInt(boundaries.get(resolution)!),
    });
  }

  // Calculate the OHLCV values for each resolution.
  for (const swap of swaps) {
    for (const [resolution, boundary] of boundaries.entries()) {
      // If the swap is within the boundary of the resolution, update the latest bar for it.
      if (swap.time >= boundary) {
        if (resolution === CandlestickResolution.PERIOD_1D) {
          console.log(boundary, swap.time);
        }
        const latestBar = latestBars.get(resolution)!;
        const price = Number(swap.avgExecutionPrice);
        latestBar.high = Math.max(latestBar.high, price);
        latestBar.low = Math.min(latestBar.low, price);
        latestBar.close = price;
        latestBar.volume += Number(swap.baseVolume);
        latestBar.guids.add(swap.guid);
      }
    }
  }

  console.log("-".repeat(100));
  console.log(new Date().toISOString());
  console.log(
    Array.from(latestBars.entries()).map(([resolution, bar]) => ({
      resolution,
      ...bar,
      time: new Date(bar.time).toISOString(),
    }))
  );
  console.log("-".repeat(100));

  return {
    swaps,
    latestBarData: Array.from(latestBars.entries()).map(([resolution, bar]) => ({
      resolution,
      bar,
    })),
  };
};

export const fetchCandlesticks = async ({
  marketID,
  resolution,
  start,
  end,
  offset = 0,
  orderBy = ORDER_BY.DESC,
  limit = LIMIT,
}: CandlestickByTimeRangeQueryArgs) => {
  // Convert date times to microseconds.
  const startMicroseconds = start.getTime() * 1000;
  const endMicroseconds = end.getTime() * 1000;

  const { data, error } = await postgrest
    .from(PERIODIC_STATE_VIEW)
    .select("*")
    .eq("market_id", Number(marketID))
    .eq("period", resolution)
    .gte("start_time", startMicroseconds)
    .range(offset, offset + limit - 1)
    .order("start_time", orderBy)
    .limit(limit)
    .then((r) => ({
      data: (r.data ?? []) as Array<JSONTypes.PeriodicStateView>,
      error: r.error,
    }));

  if (error) {
    console.warn("Error fetching chat events", error);
  }

  // Filter out data outside of the requested time range and convert to a PeriodicStateView.
  return data.reduce((acc, view) => {
    if (view.start_time <= endMicroseconds) {
      acc.push(toPeriodicStateView(view));
    }
    return acc;
  }, [] as Types.PeriodicStateView[]);
};

export const paginateCandlesticks = async (
  args: SharedCandlestickQueryArgs &
    Omit<AggregateQueryResultsArgs, "query"> & { resolution?: CandlestickResolution }
) => {
  const { marketID, resolution } = args;
  let query = postgrest
    .from(INBOX_EVENTS_TABLE)
    .select("*")
    .filter("event_name", "eq", "emojicoin_dot_fun::PeriodicState")
    .eq("data->market_metadata->market_id", wrap(marketID))
    .limit(Math.min(LIMIT, args.maxTotalRows ?? Infinity))
    .order("transaction_version", ORDER_BY.DESC);
  query = resolution ? query.eq("data->periodic_state_metadata->period", wrap(resolution)) : query;

  const { data, errors } = await aggregateQueryResults<JSONTypes.PeriodicStateEvent>({
    query,
    ...args,
  });

  if (errors.some((e) => e)) {
    console.warn("Error fetching chat events", errors);
  }

  return data;
};
