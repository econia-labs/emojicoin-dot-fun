import "server-only";

import { MARKET_DATA_VIEW } from "./const";
import { type JSONTypes } from "../types";
import { aggregateQueryResults, type AggregateQueryResultsArgs } from "./query-helper";
import { postgrest } from "./inbox-url";

type QueryArgs = {} & Omit<AggregateQueryResultsArgs, "query">;

/* eslint-disable-next-line import/no-unused-modules */
export const paginateMarketData = async (args: QueryArgs) => {
  const query = postgrest.from(MARKET_DATA_VIEW).select("*");

  const { data, errors } = await aggregateQueryResults<JSONTypes.MarketDataView>({
    query,
    ...args,
  });

  if (errors.some((e) => e)) {
    /* eslint-disable-next-line no-console */
    console.warn("Error fetching chat events", errors);
  }

  return data;
};
