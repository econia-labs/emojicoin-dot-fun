import { toSwapEvent } from "@sdk/types";
import { paginateSwapEvents } from "@sdk/queries/swap";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";
import { SAMPLE_DATA_BASE_URL } from "./const";

const getInitialSwapData = cache(async (marketID: string) => {
  const swapEvents = await fetchInitialWithFallback({
    functionArgs: {
      marketID: BigInt(marketID),
    },
    queryFunction: paginateSwapEvents,
    endpoint: new URL(`swap-data-${Number(marketID)}.json`, SAMPLE_DATA_BASE_URL),
  });
  return swapEvents.map(swap => ({ ...toSwapEvent(swap), version: swap.version }));
});

export default getInitialSwapData;
