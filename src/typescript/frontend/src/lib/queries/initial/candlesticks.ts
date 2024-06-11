"use server";

import { paginateCandlesticks } from "@sdk/queries/candlestick";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";
import { type GroupedPeriodicStateEvents } from "@sdk/queries/client-utils/candlestick";

// To use the type so we can link it in the JSDoc.
let _: GroupedPeriodicStateEvents;

/**
 * @see {@link GroupedPeriodicStateEvents}
 */
const getInitialCandlesticks = cache(async (marketID: string) => {
  const candlesticks = await fetchInitialWithFallback({
    functionArgs: {
      marketID: BigInt(marketID),
    },
    queryFunction: paginateCandlesticks,
  });
  return candlesticks.events;
});

export default getInitialCandlesticks;
