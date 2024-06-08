"use server";

import { toSwapEvent } from "@sdk/types";
import { paginateSwapEvents } from "@sdk/queries/swap";
import { cache } from "react";
import { fetchInitialWithFallback } from "./cache-helper";

const getInitialSwapData = cache(
  async (args: { marketID: string; maxTotalRows?: number; maxNumQueries?: number }) => {
    const { marketID, maxTotalRows, maxNumQueries } = args;
    const swapEvents = await fetchInitialWithFallback({
      functionArgs: {
        marketID: BigInt(marketID),
        maxTotalRows,
        maxNumQueries,
      },
      queryFunction: paginateSwapEvents,
    });
    return swapEvents.map((swap) => ({
      ...toSwapEvent(swap, swap.version),
      version: swap.version,
    }));
  }
);

export default getInitialSwapData;
