"use server";

import { type AnyNumberString, toSwapEvent } from "@sdk/types";
import { paginateSwapEvents } from "@sdk/queries/swap";

const fetchInitialSwapData = async (args: {
  marketID: AnyNumberString;
  maxTotalRows?: number;
  maxNumQueries?: number;
}) => {
  const { marketID, maxTotalRows, maxNumQueries } = args;
  const swapEvents = await paginateSwapEvents({
    marketID,
    maxTotalRows,
    maxNumQueries,
  });
  return swapEvents.map((swap) => toSwapEvent(swap, swap.version));
};

export default fetchInitialSwapData;
