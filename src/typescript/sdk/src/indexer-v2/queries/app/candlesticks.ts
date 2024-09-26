"use server";

import { type Period } from "../../../const";
import { LIMIT } from "../../../queries/const";
import { type PeriodicStateEventModel } from "../../types";
import { fetchPeriodicEventsSince } from "./market";

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
 * @returns an Array<PeriodicStateEventModel>.
 */
/* eslint-disable-next-line import/no-unused-modules */
export async function fetchAllCandlesticksInTimeRange(args: {
  marketID: string;
  start: Date;
  end: Date;
  period: Period;
  limit?: number;
  fetchDelay?: number;
}): Promise<PeriodicStateEventModel[]> {
  const { marketID, start, end, period, limit = LIMIT, fetchDelay = 0 } = args;
  const aggregate: PeriodicStateEventModel[] = [];
  let keepFetching = true;

  /* eslint-disable consistent-return */
  const fetchData = async (
    resolve: (value: PeriodicStateEventModel[] | PromiseLike<PeriodicStateEventModel[]>) => void,
    reject: (reason?: string | Error) => void
  ) => {
    /* eslint-enable consistent-return */
    if (!keepFetching) {
      return resolve(aggregate);
    }
    try {
      const data = await fetchPeriodicEventsSince({
        marketID,
        period,
        start,
        offset: aggregate.length,
        limit,
      });
      const filtered = data.filter((d) => d.transaction.timestamp.getTime() <= end.getTime());
      keepFetching = filtered.length === limit;
      aggregate.push(...filtered);

      setTimeout(() => fetchData(resolve, reject), fetchDelay);
    } catch (err) {
      return reject(err as string | Error);
    }
  };

  return new Promise<PeriodicStateEventModel[]>((resolve, reject) => {
    fetchData(resolve, reject);
  });
}
