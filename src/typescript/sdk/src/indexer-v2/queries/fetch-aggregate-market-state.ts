import { toAggregateMarketState, type DatabaseJsonType } from "../types";
import { postgrest } from "./client";

export const callAggregateMarketState = () =>
  // Since this is a read-only function call, prefer to call this as a `GET` request. It makes API
  // gateway authorization simpler and cleaner.
  postgrest
    .rpc("aggregate_market_state", {}, { get: true })
    .select("*")
    .single()
    .then((res) => {
      if (res.data) {
        return res.data as DatabaseJsonType["aggregate_market_state"];
      }
      throw new Error("RPC call to `aggregate_market_state` failed, `null` was returned.");
    })
    .then(toAggregateMarketState);
