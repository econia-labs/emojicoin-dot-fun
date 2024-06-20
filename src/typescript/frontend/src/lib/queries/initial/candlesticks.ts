"use server";

import { paginateCandlesticks } from "@sdk/queries/candlestick";
import { type AnyNumberString, toPeriodicStateEvent } from "@sdk-types";

const fetchInitialCandlestickData = async (args: {
  marketID: AnyNumberString;
  maxTotalRows?: number;
  maxNumQueries?: number;
}) => {
  const { marketID, maxTotalRows, maxNumQueries } = args;
  const candlesticks = await paginateCandlesticks({
    marketID,
    maxTotalRows,
    maxNumQueries,
  });
  return candlesticks.map((candlestick) => toPeriodicStateEvent(candlestick, candlestick.version));
};

export default fetchInitialCandlestickData;
