import { toSwapEvent, type JSONTypes } from "@/sdk/types";
import { paginateSwapEvents } from "@/sdk/queries/swap";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";
import { SAMPLE_DATA_BASE_URL } from "./const";

const getInitialSwapData = cache(async (marketID: bigint | number) => {
  const swapEvents: Array<JSONTypes.SwapEvent> = await fetchInitialWithFallback({
    functionArgs: {
      marketID,
    },
    queryFunction: paginateSwapEvents,
    endpoint: new URL(`swap-data-${Number(marketID)}.json`, SAMPLE_DATA_BASE_URL),
  });

  return swapEvents.map(swap => toSwapEvent(swap));
});

export default getInitialSwapData;
