/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */
import { PostgrestClient, type PostgrestError } from "@supabase/postgrest-js";
import { type CandlestickResolution, INBOX_URL, MODULE_ADDRESS } from "../const";
import { TABLE_NAME, ORDER_BY } from "./const";
import { STRUCT_STRINGS, getCurrentPeriodBoundary } from "../utils";
import { wrap } from "./utils";
import { type ContractTypes, type JSONTypes, toPeriodicStateEvent } from "../types";
import {
  type AggregateQueryResultsArgs,
  type EventsAndErrors,
  aggregateQueryResults,
} from "./query-helper";

export type CandlestickQueryArgs = {
  marketID: bigint | number;
  resolution: CandlestickResolution;
  inboxUrl?: string;
};

export const paginateCandlesticks = async (
  args: CandlestickQueryArgs & Omit<AggregateQueryResultsArgs, "query">
): Promise<EventsAndErrors<ContractTypes.PeriodicStateEvent>> => {
  const { marketID, resolution, inboxUrl = INBOX_URL } = args;
  const query = new PostgrestClient(inboxUrl)
    .from(TABLE_NAME)
    .select("*")
    .filter("type", "eq", STRUCT_STRINGS.PeriodicStateEvent)
    .eq("data->market_metadata->market_id", wrap(marketID))
    .eq("data->periodic_state_metadata->period", wrap(resolution))
    .order("transaction_version", ORDER_BY.DESC);

  const res = await aggregateQueryResults<JSONTypes.PeriodicStateEvent>({
    query,
  });

  return {
    events: res.data.map((e) => toPeriodicStateEvent(e)),
    errors: res.errors,
  };
};

export type CandlestickPeriod = {
  open: bigint;
  high: bigint;
  low: bigint;
  close: bigint;
  volume: bigint;
  start_time: Date;
  end_time: Date;
};

type CandlestickPeriodFromDB = {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  start_time: string;
  end_time: string;
};

export type CurrentCandlestickResponse = {
  data: CandlestickPeriod;
  error: PostgrestError | null;
};

export const getCurrentCandlestick = async (
  args: CandlestickQueryArgs
): Promise<CurrentCandlestickResponse> => {
  const { marketID, resolution, inboxUrl = INBOX_URL } = args;
  const postgrest = new PostgrestClient(inboxUrl);

  const periodBoundary = BigInt(getCurrentPeriodBoundary(resolution));

  const { data, error } = await postgrest
    .rpc("get_candlestick_data", {
      module_address: MODULE_ADDRESS.toString(),
      period_boundary: periodBoundary.toString(),
      market_id: marketID,
    })
    .then((res) => ({
      data: res.data?.pop() as CandlestickPeriodFromDB,
      error: res.error,
    }));

  return {
    data: {
      open: BigInt(data.open),
      high: BigInt(data.high),
      low: BigInt(data.low),
      close: BigInt(data.close),
      volume: BigInt(data.volume),
      start_time: new Date(Number(data.start_time) / 1000), // DB returns microseconds
      end_time: new Date(Number(data.end_time) / 1000), // DB returns microseconds
    },
    error,
  };
};
