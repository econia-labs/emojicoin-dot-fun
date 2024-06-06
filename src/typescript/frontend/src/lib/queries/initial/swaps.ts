"use server";

import { toSwapEvent } from "@sdk/types";
import { paginateSwapEvents } from "@sdk/queries/swap";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";

const getInitialSwapData = cache(async (marketID: string) => {
  const swapEvents = await fetchInitialWithFallback({
    functionArgs: {
      marketID: BigInt(marketID),
    },
    queryFunction: paginateSwapEvents,
  });
  return swapEvents.map((swap) => ({ ...toSwapEvent(swap, swap.version), version: swap.version }));
});

export default getInitialSwapData;
