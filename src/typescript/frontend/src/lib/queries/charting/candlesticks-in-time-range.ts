"use server";

import { type Types } from "@sdk-types";
import { type PeriodDuration } from "@sdk/const";
import { fetchCandlesticks } from "@sdk/queries/candlestick";
import { LIMIT, ORDER_BY } from "@sdk/queries/const";

/**
 * Query to exhaustively fetch all candlesticks (periodic state events) in a given time range.
 * Since this function's data will be used for frontend charting, it's
 * written with non-blocking pseudo-recursive setTimeout calls to avoid
 * blocking the main javascript execution thread.
 *
 * @param marketID The market ID to fetch data for.
 * @param start The start time of the range to fetch data from.
 * @param end The end time of the range to fetch data from.
 * @param period The period of the candlesticks to fetch.
 * @param limit Optional limit to the number of elements to fetch per request. Defaults to `LIMIT`.
 * @param fetchDelay Optional delay in milliseconds between each fetch request.
 * @returns an Array<Types.PeriodicStateEvent>.
 */
export async function fetchAllCandlesticksInTimeRange(args: {
  marketID: string;
  start: Date;
  end: Date;
  period: PeriodDuration;
  limit?: number;
  fetchDelay?: number;
}): Promise<Types.PeriodicStateView[]> {
  const { marketID, start, end, period, limit = LIMIT, fetchDelay = 0 } = args;
  const aggregate: Types.PeriodicStateView[] = [];
  let keepFetching = true;

  const fetchData = async (
    resolve: (value: Types.PeriodicStateView[] | PromiseLike<Types.PeriodicStateView[]>) => void,
    reject: (reason?: string | Error) => void
  ) => {
    if (!keepFetching) {
      return resolve(aggregate);
    }

    const offset = aggregate.length;

    try {
      const data = await fetchCandlesticks({
        marketID,
        period,
        start,
        end,
        offset,
        limit,
        orderBy: ORDER_BY.ASC,
      });
      keepFetching = data.length === limit;
      aggregate.push(...data);

      setTimeout(() => fetchData(resolve, reject), fetchDelay);
    } catch (error) {
      return reject(error as string | Error);
    }
  };

  return new Promise<Types.PeriodicStateView[]>((resolve, reject) => {
    fetchData(resolve, reject);
  });
}
