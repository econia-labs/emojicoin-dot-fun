import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";

export type ParcelQueryParameters = {
  count: number;
  /** Inclusive. */
  to: number;
};

type CachedWrapperReturn = {
  stringifiedData: string;
  length: number;
  first: number;
};

const cachedWrapper = async <S>(
  params: ParcelQueryParameters,
  fetchFn: (params: ParcelQueryParameters) => Promise<S[]>,
  getKey: (s: S) => number
): Promise<CachedWrapperReturn> => {
  const data = await fetchFn(params);
  return {
    stringifiedData: stringifyJSON<S[]>(data),
    length: data.length,
    first: getKey(data[data.length - 1]),
  };
};

/**
 * Parcel data query helper.
 *
 * This class is a query helper to query cached parcels.
 *
 * The helper separates data in parcels, making data easier to cache and query in batch.
 *
 * Parcels are separated into two categories: historic and current. Historic
 * parcels are parcels for which all events have already been emitted. This
 * means that they are now constant and can be cached forever. Current parcels
 * however may still get new events added as time goes on and need to be cached
 * for a smaller amount of time.
 *
 * # Example
 *
 * ```
 *                                           now
 * | -------------- | -------------- | -------|
 * | E0 E1 E2 E3 E4 | E5 E6 E7 E8 E9 | EA EB EC
 * |    historic    |    historic    |    current
 * | cached forever | cached forever | cached for 1 sec
 * | -------------- | -------------- |--------
 * ```
 *
 * Parcels have a size that is passed in the constructor. Parcels also have a
 * range. If parcel size is 5, parcel 0's range is [0,5), parcel 1's range is
 * [5,10), etc. Note that this range is not in events, but in keys. For example,
 * we could have a timestamp in seconds as key. In that case, parcel 0's range
 * is between second 0 and second 5, which could contain less than 5 events.
 *
 * Optionally, a `step` can be passed to the constructor. If passed, the range
 * of the first parcel would be [0 * step, 5 * step), etc. This is useful if
 * your key is time and events are supposed to be emitted every X seconds.
 *
 * A parcel will always contain the same amount of events (the amount is parcel
 * size that is passed at construction). The only exception can be the first
 * parcel. When not enough events are in the range of a parcel, the parcel will
 * contain events from the previous parcel.
 *
 * # Example
 *
 * ```
 *                                                            now
 * | -------------- | -------------- | -------------- | -------|--------
 * | E0 E1 E2 E3 E4 | E5 E6 E7 E8 E9 | EA EB EC ED EE | EF EG EH -------
 * |    historic    |    historic    |    historic    |    current -----
 * | -------------- | -------------- | -------------- | ----------------
 *
 * Parcel 1:
 *                                                            now
 * | -------------- |                                          |
 * | EV    EV EV    |          EV    | EV       EV EV | EV    EV
 * | t0 t1 t2 t3 t4 | t5 t6 t7 t8 t9 | tA tB tC tD tt | tF tG tH
 * | -------------- |
 *
 * Parcel 2:
 *                                                            now
 * | ------------------------------- |                         |
 * | EV    EV EV    |          EV    | EV       EV EV | EV    EV
 * | t0 t1 t2 t3 t4 | t5 t6 t7 t8 t9 | tA tB tC tD tt | tF tG tH
 * | ------------------------------- |                 
 *
 * Parcel 3:
 *                                                            now
 * |         |--------------------------------------- |        |
 * | EV    EV|EV    |          EV    | EV       EV EV | EV    EV
 * | t0 t1 t2|t3 t4 | t5 t6 t7 t8 t9 | tA tB tC tD tt | tF tG tH
 * |         |--------------------------------------- |
 *
 * Parcel 4:
 *                                                            now
 * |                                 | ------------------------|- |
 * | EV    EV EV    |          EV    | EV       EV EV | EV    EV
 * | t0 t1 t2 t3 t4 | t5 t6 t7 t8 t9 | tA tB tC tD tt | tF tG tH
 * |                                 |--------------------------- |
 *
 * ```
 *
 * In this case, we have a parcel size of 5. t0..tH is a time range. EV means
 * an event happened at tX.
 *
 * ## Example query flow
 *
 * When querying 10 events starting from now, the first parcel read will be the
 * current one. This parcel has 5 events. We need to get 5 more. Since this
 * parcel also contained all events in the range of parcel 3, we will directly
 * query parcel 2. This parcel has 4 events. We need to get 1 more. Since we
 * already got the earliest event, we stop here.
 */
export class Parcel<S> {
  private _parcelSize: number;
  private _currentFetch: (params: ParcelQueryParameters) => Promise<CachedWrapperReturn>;
  private _historicFetch: (params: ParcelQueryParameters) => Promise<CachedWrapperReturn>;
  private _fetchHistoricThreshold: () => Promise<number>;
  private _fetchFirst: () => Promise<number>;
  private _getKey: (s: S) => number;
  private _step: number;

  constructor({
    parcelSize,
    cacheKey,
    fetchFn,
    currentRevalidate,
    historicRevalidate,
    fetchHistoricThreshold,
    fetchFirst,
    getKey,
    step = 1,
  }: {
    /** How many events are stored in one parcel. */
    parcelSize: number;
    /** Unique cache key to store the cached events. */
    cacheKey: string;
    /** A function to fetch events. Events must be returned sorted by key in descending order. */
    fetchFn: (params: ParcelQueryParameters) => Promise<S[]>;
    /** How much time current parcels are cached. */
    currentRevalidate: number;
    /** How much time historic parcels are cached. */
    historicRevalidate: number;
    /** A function that tells from which key a parcel is considered finished. */
    fetchHistoricThreshold: () => Promise<number>;
    /** A function that returns the key of the first event. */
    fetchFirst: () => Promise<number>;
    /** A function that returns the key of an event. */
    getKey: (s: S) => number;
    /** The spacing between keys. 1 by default. */
    step?: number;
  }) {
    this._parcelSize = parcelSize;
    this._currentFetch = unstable_cache(
      (params: ParcelQueryParameters) => cachedWrapper(params, fetchFn, getKey),
      ["parcel", cacheKey, "current", parcelSize.toString()],
      { revalidate: currentRevalidate }
    );
    this._historicFetch = unstable_cache(
      (params: ParcelQueryParameters) => cachedWrapper(params, fetchFn, getKey),
      ["parcel", cacheKey, "historic", parcelSize.toString()],
      { revalidate: historicRevalidate }
    );
    this._fetchHistoricThreshold = unstable_cache(
      fetchHistoricThreshold,
      ["parcel", cacheKey, "threshold"],
      { revalidate: 2 }
    );
    this._fetchFirst = unstable_cache(
      fetchFirst,
      ["parcel", cacheKey, "first"],
      { revalidate: 365 * 24 * 60 * 60 }
    );
    this._getKey = getKey;
    this._step = step;
  }

  /** Get the parcel number from a key. */
  private toParcelNumber(to: number): number {
    return Math.floor(to / this._step / this._parcelSize);
  }

  /** Get the start key of a parcel from a parcel number. */
  private toKey(parcel: number): number {
    return parcel * this._step * this._parcelSize;
  }

  /** Get the parcel start key from a key in that parcel. */
  private parcelStartKey(key: number): number {
    return this.toKey(this.toParcelNumber(key));
  }

  /** Get the parcel start key from a key in that parcel. */
  private parcelEndKey(key: number): number {
    return this.parcelStartKey(key) + this._parcelSize * this._step;
  }

  /** Get `count` events starting from `to` (inclusive) backwards. */
  async getData(to: number, count: number): Promise<S[]> {
    let first: number;
    try {
      first = await this._fetchFirst();
    } catch (e) {
      console.warn(
        "Could not get first event. This either means that no events have yet been emmited for this data type, or that the fetch first event function is wrong.",
        e
      );
      return [];
    }
    if (to < first) {
      return [];
    }

    let parcel: CachedWrapperReturn;
    const historicThreshold = await this._fetchHistoricThreshold();

    const rightmostParcelNumber = this.toParcelNumber(to);
    const rightmostParcelEndKey = this.parcelEndKey(rightmostParcelNumber);

    if (rightmostParcelEndKey > historicThreshold) {
      parcel = await this._currentFetch({ to: rightmostParcelEndKey, count: this._parcelSize });
    } else {
      parcel = await this._historicFetch({ to: rightmostParcelEndKey, count: this._parcelSize });
    }

    let events = parseJSON<S[]>(parcel.stringifiedData).filter((s) => this._getKey(s) <= to);

    while (events.length < count && parcel.first > first) {
      const endKey = this.parcelEndKey(parcel.first - 1);
      parcel = await this._historicFetch({
        to: endKey,
        count: this._parcelSize,
      });
      const newEvents: S[] = (parseJSON(parcel.stringifiedData) as S[])
        .filter(e => this._getKey(e) < this._getKey(events[events.length - 1]));
      events = [...events, ...newEvents];
    }

    return events;
  }
}

