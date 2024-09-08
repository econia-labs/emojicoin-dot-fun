"use server";

import { type PeriodDuration } from "../const";
import { INBOX_EVENTS_TABLE, LIMIT, ORDER_BY, PERIODIC_STATE_VIEW } from "./const";
import { type Types, toPeriodicStateView, type JSONTypes } from "../types";
import { type AggregateQueryResultsArgs, aggregateQueryResults } from "./query-helper";
import { postgrest } from "./inbox-url";
import { type ValueOf } from "../utils/utility-types";

export type SharedCandlestickQueryArgs = {
  marketID: bigint | number | string;
  period: PeriodDuration;
  limit?: number;
};

export type CandlestickByTimeRangeQueryArgs = SharedCandlestickQueryArgs & {
  start: Date;
  end: Date;
  offset: number;
  orderBy?: ValueOf<typeof ORDER_BY>;
};

export const fetchCandlesticks = async ({
  marketID,
  period,
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
    .eq("period", period)
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
  args: Omit<SharedCandlestickQueryArgs, "period"> &
    Omit<AggregateQueryResultsArgs, "query"> & { period?: PeriodDuration }
) => {
  const { marketID, period } = args;
  let query = postgrest
    .from(INBOX_EVENTS_TABLE)
    .select("*")
    .filter("event_name", "eq", "emojicoin_dot_fun::PeriodicState")
    .eq("data->market_metadata->>market_id", marketID)
    .limit(Math.min(LIMIT, args.maxTotalRows ?? Infinity))
    .order("transaction_version", ORDER_BY.DESC);
  query = period ? query.eq("data->periodic_state_metadata->>period", period) : query;

  const { data, errors } = await aggregateQueryResults<JSONTypes.PeriodicStateEvent>({
    query,
    ...args,
  });

  if (errors.some((e) => e)) {
    console.warn("Error fetching chat events", errors);
  }

  return data;
};
