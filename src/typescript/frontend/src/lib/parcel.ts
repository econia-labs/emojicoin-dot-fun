import { unstable_cache } from "next/cache";
import { parseJSON, stringifyJSON } from "utils";

const jsonStrAppend = (a: string, b: string): string => {
  if (a === "[]") return b;
  if (b === "[]") return a;
  return `${a.substring(0, a.length - 1)},${b.substring(1)}`;
};

export type ParcelQueryParameters = {
  count: number;
  to: number;
};

type CachedWrapperReturn = {
  stringifiedData: string;
  length: number;
  first: number;
};

const cachedWrapper = async <S, Q>(
  params: ParcelQueryParameters,
  query: Q,
  fetchFn: (params: ParcelQueryParameters, query: Q) => Promise<S[]>,
  getKey: (s: S) => number
): Promise<CachedWrapperReturn> => {
  const data = await fetchFn(params, query);
  return {
    stringifiedData: stringifyJSON<S[]>(data),
    length: data.length,
    first: getKey(data[data.length - 1]),
  };
};

// Parcel data query helper.
//
// This class is a query helper to query cached parcels.
//
// The helper separates data in parcels, making data easier to cache and query in batch.
export class Parcel<S, Q> {
  private _parcelSize: number;
  private _normalFetch: (params: ParcelQueryParameters, query: Q) => Promise<CachedWrapperReturn>;
  private _historicFetch: (params: ParcelQueryParameters, query: Q) => Promise<CachedWrapperReturn>;
  private _fetchHistoricThreshold: (query: Q) => Promise<number>;
  private _fetchFirst: (query: Q) => Promise<number>;
  private _getKey: (s: S) => number;
  private _step: number;
  private _cacheKey: string;

  constructor({
    parcelSize,
    cacheKey,
    fetchFn,
    normalRevalidate,
    historicRevalidate,
    fetchHistoricThreshold,
    fetchFirst,
    getKey,
    step,
  }: {
    parcelSize: number;
    cacheKey: string;
    fetchFn: (params: ParcelQueryParameters, query: Q) => Promise<S[]>;
    normalRevalidate: number;
    historicRevalidate: number;
    fetchHistoricThreshold: (query: Q) => Promise<number>;
    fetchFirst: (query: Q) => Promise<number>;
    getKey: (s: S) => number;
    step?: number;
  }) {
    this._parcelSize = parcelSize;
    this._normalFetch = unstable_cache(
      (params: ParcelQueryParameters, query: Q) => cachedWrapper(params, query, fetchFn, getKey),
      ["parcel", cacheKey, "normal", parcelSize.toString()],
      { revalidate: normalRevalidate }
    );
    this._historicFetch = unstable_cache(
      (params: ParcelQueryParameters, query: Q) => cachedWrapper(params, query, fetchFn, getKey),
      ["parcel", cacheKey, "historic", parcelSize.toString()],
      { revalidate: historicRevalidate }
    );
    this._fetchHistoricThreshold = unstable_cache(
      (query: Q) => fetchHistoricThreshold(query),
      ["parcel", cacheKey, "threshold"],
      { revalidate: 2 }
    );
    this._fetchFirst = unstable_cache(
      (query: Q) => fetchFirst(query),
      ["parcel", cacheKey, "first"],
      { revalidate: 365 * 24 * 60 * 60 }
    );
    this._getKey = getKey;
    this._step = step ?? 1;
    this._cacheKey = cacheKey;
  }

  private parcelize(to: number): number {
    return Math.floor(to / this._step / this._parcelSize);
  }

  private unparcelize(parcel: number): number {
    return parcel * this._step * this._parcelSize;
  }

  async getData(to: number, count: number, query: Q): Promise<S[]> {
    return parseJSON<S[]>(await this.getUnparsedData(to, count, query));
  }

  async getUnparsedData(to: number, count: number, query: Q): Promise<string> {
    let first: number;
    try {
      first = await this._fetchFirst(query);
    } catch (e) {
      console.warn(
        "Could not get first event. This either means that no events have yet been emmited for this data type, or that the fetch first event function is wrong.",
        e
      );
      return "[]";
    }
    if (to < first) {
      return "[]";
    }
    const lastParcel = this.parcelize(to);
    let dataCount = 0;
    const historicThreshold = await this._fetchHistoricThreshold(query);
    let lastParcelData: CachedWrapperReturn;
    const end = this.unparcelize(lastParcel + 1);
    if (this.unparcelize(lastParcel + 1) > historicThreshold) {
      lastParcelData = await this._normalFetch({ to: end, count: this._parcelSize }, query);
    } else {
      lastParcelData = await this._historicFetch({ to: end, count: this._parcelSize }, query);
    }
    const parsedLastParcel = parseJSON<S[]>(lastParcelData.stringifiedData);
    const relevantData = parsedLastParcel.filter((s) => this._getKey(s) < to);
    dataCount += relevantData.length;
    let dataString = lastParcelData.stringifiedData;
    let parcel = this.parcelize(lastParcelData.first) - 1;
    for (; dataCount < count && this.unparcelize(parcel) > first; ) {
      const start = this.unparcelize(parcel);
      const params = {
        to: start + this._parcelSize,
        count: this._parcelSize,
      };
      const parcelData = await this._historicFetch(params, query);
      dataCount += parcelData.length;
      dataString = jsonStrAppend(dataString, parcelData.stringifiedData);
      parcel = this.parcelize(parcelData.first) - 1;
    }
    return dataString;
  }
}
