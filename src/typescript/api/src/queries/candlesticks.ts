/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { PostgrestClient } from "@supabase/postgrest-js";
import { INBOX_URL, LIMIT, ORDER_BY, TABLE_NAME } from "./const";
import { PeriodicStateEvent } from "../emojicoin_dot_fun/events";
import { type CandlestickResolution } from "../emojicoin_dot_fun/const";

/* eslint-disable-next-line */
export const getPeriodicStateEvents = ({ after = new Date() }: { after: Date }) => {};

/**
 * `postgrest` requires string values to be wrapped in double quotes
 * when filtering by inner jsonb columns.
 * @param val
 * @returns string
 *
 * @example
 * s(1) === "\"1\""
 * s(BigInt(1)) === "\"1\""
 * s("1") === "\"1\""
 * s("hello") === "\"hello\""
 */
const wrap = (val: number | bigint | string): string => {
  switch (typeof val) {
    case "number":
      return `"${val.toString()}"`;
    case "bigint":
      return `"${val.toString()}"`;
    case "string":
      return `"${val}"`;
    default:
      throw new Error(`Invalid value: ${val}`);
  }
};

export type CandlestickQueryArgs = {
  marketID: number;
  resolution: CandlestickResolution;
  inboxUrl?: string;
  limit?: number;
};

export const getAllCandlesticks = async (args: CandlestickQueryArgs): Promise<Array<PeriodicStateEvent>> => {
  const {
    marketID,
    resolution,
    inboxUrl = INBOX_URL,
    limit = LIMIT
  } = args;
  const postgrest = new PostgrestClient(inboxUrl);

  const aggregated: PeriodicStateEvent[] = [];
  let go = true;
  while (go) {
    const offset = aggregated.length;
    const [count, data] = await postgrest
      .from(TABLE_NAME)
      .select("*")
      .filter("type", "eq", PeriodicStateEvent.STRUCT_STRING)
      .eq("data->market_metadata->market_id", wrap(marketID))
      .eq("data->periodic_state_metadata->period", wrap(resolution))
      .order("transaction_version", ORDER_BY.DESC)
      .range(offset, offset + limit - 1)
      .then((res) => [res.count ?? 0, res.data ?? []] as const);

    aggregated.push(...data.map((v) => PeriodicStateEvent.from(v)));
    go = count !== 0;
  }

  return aggregated;
};
