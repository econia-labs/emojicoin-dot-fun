import { expect, test } from "@playwright/test";
import { Parcel } from "../../src/lib/parcel";
import { parseJSON, stringifyJSON } from "utils";

test("test normal parcel", async () => {
  // Store reads in this array to check cache hits.
  let reads: { count: number; to: number }[] = [];
  // Parcel where every key has an event.
  const parcelData = [0, 1, 2, 3, 4, 6, 6, 7, 8, 9, 11, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const cache = new Map<string, { expire: number; value: string }>();
  const helper = new Parcel<number>({
    parcelSize: 5,
    cacheKey: "test-parcels",
    fetchFn: async (params) => {
      const { to, count } = params;
      reads.push(params);
      const valid = parcelData.filter((v) => v < to);
      return valid.slice(Math.max(valid.length - count, 0), valid.length).toReversed();
    },
    currentRevalidate: 5,
    historicRevalidate: 1000000,
    fetchHistoricThreshold: async () => 10,
    fetchFirst: async () => 0,
    getKey: (s) => s,
    cacheFn: (fn, keys, { revalidate }) => {
      return async (...params) => {
        const cacheKey = stringifyJSON([...keys, ...params]);
        const cachedValue = cache.get(cacheKey);
        if (cachedValue && cachedValue.expire * 1000 > new Date().getTime()) {
          return parseJSON(cachedValue.value);
        } else {
          const res = await fn(...params);
          cache.set(cacheKey, {
            expire: new Date().getTime() + revalidate * 1000,
            value: stringifyJSON(res),
          });
          return res;
        }
      };
    },
  });

  const data = await helper.getData(20, 6);
  expect(data).toStrictEqual([19, 18, 17, 16, 15, 14]);
  expect(reads).toStrictEqual([
    { count: 5, to: 20 },
    { count: 5, to: 15 },
  ]);
});

test("test parcel with missing data", async () => {
  // Store reads in this array to check cache hits.
  let reads: { count: number; to: number }[] = [];
  // Parcel where not every key has an event.
  const parcelData = [
    // Parcel 1.
    0, 1, 2, 4,
    // Parcel 2. Also contains part of parcel 1 (4, 2 and 1) in order to have 5 events.
    5, 8,
    // Parcel 3. Also contains parcel 2 and part of parcel 1 (4) in order to have 5 events.
    12, 14,
    // Parcel 4. Also contains parcel 3 and part of parcel 2 (8) in order to have 5 events.
    15, 18,
  ];
  const cache = new Map<string, { expire: number; value: string }>();
  const helper = new Parcel<number>({
    parcelSize: 5,
    cacheKey: "test-parcels-2",
    fetchFn: async (params) => {
      const { to, count } = params;
      reads.push(params);
      const valid = parcelData.filter((v) => v < to);
      return valid.slice(Math.max(valid.length - count, 0), valid.length).toReversed();
    },
    currentRevalidate: 5,
    historicRevalidate: 1000000,
    fetchHistoricThreshold: async () => 10,
    fetchFirst: async () => 0,
    getKey: (s) => s,
    cacheFn: (fn, keys, { revalidate }) => {
      return async (...params) => {
        const cacheKey = stringifyJSON([...keys, ...params]);
        const cachedValue = cache.get(cacheKey);
        if (cachedValue && cachedValue.expire * 1000 > new Date().getTime()) {
          return parseJSON(cachedValue.value);
        } else {
          const res = await fn(...params);
          cache.set(cacheKey, {
            expire: new Date().getTime() + revalidate * 1000,
            value: stringifyJSON(res),
          });
          return res;
        }
      };
    },
  });

  // Get 6 events starting from 20 exclusive.
  const data1 = await helper.getData(20, 6);
  expect(data1).toStrictEqual([18, 15, 14, 12, 8, 5]);
  // Only parcel 4 and 2 should see a read since parcel 3 is stored inside parcel 4.
  expect(reads).toStrictEqual([
    { count: 5, to: 20 },
    { count: 5, to: 10 },
  ]);

  reads = [];
  // Get all events.
  const data2 = await helper.getData(20, 20);
  expect(data2).toStrictEqual([18, 15, 14, 12, 8, 5, 4, 2, 1, 0]);
  // Only parcel 1 should see a read since the other data is already read.
  expect(reads).toStrictEqual([{ count: 5, to: 5 }]);

  // Here parcel 3 is never read. This is normal since it's contained in parcel 4.
  // Theoretically, it might see a read if the query starts in parcel 3 (e.g.: getData(13, 5)).
  // But in real world usage, this should not happened, as the clients do not request random data like that.
  // They will always start to query from the most recent event, and then in reverse chronological order from there.
});

test("test exclusiveness", async () => {
  let reads: { count: number; to: number }[] = [];
  const parcelData = [0, 1, 2, 3, 4, 6, 6, 7, 8, 9, 11, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const cache = new Map<string, { expire: number; value: string }>();
  const helper = new Parcel<number>({
    parcelSize: 5,
    cacheKey: "test-parcels",
    fetchFn: async (params) => {
      const { to, count } = params;
      reads.push(params);
      const valid = parcelData.filter((v) => v < to);
      return valid.slice(Math.max(valid.length - count, 0), valid.length).toReversed();
    },
    currentRevalidate: 5,
    historicRevalidate: 1000000,
    fetchHistoricThreshold: async () => 10,
    fetchFirst: async () => 0,
    getKey: (s) => s,
    cacheFn: (fn, keys, { revalidate }) => {
      return async (...params) => {
        const cacheKey = stringifyJSON([...keys, ...params]);
        const cachedValue = cache.get(cacheKey);
        if (cachedValue && cachedValue.expire * 1000 > new Date().getTime()) {
          return parseJSON(cachedValue.value);
        } else {
          const res = await fn(...params);
          cache.set(cacheKey, {
            expire: new Date().getTime() + revalidate * 1000,
            value: stringifyJSON(res),
          });
          return res;
        }
      };
    },
  });

  const data = await helper.getData(5, 1);
  expect(data).toStrictEqual([4]);
});

test("test request 0", async () => {
  let reads: { count: number; to: number }[] = [];
  const parcelData = [0, 1, 2, 3, 4, 6, 6, 7, 8, 9, 11, 11, 12, 13, 14, 15, 16, 17, 18, 19];
  const cache = new Map<string, { expire: number; value: string }>();
  const helper = new Parcel<number>({
    parcelSize: 5,
    cacheKey: "test-parcels",
    fetchFn: async (params) => {
      const { to, count } = params;
      reads.push(params);
      const valid = parcelData.filter((v) => v < to);
      return valid.slice(Math.max(valid.length - count, 0), valid.length).toReversed();
    },
    currentRevalidate: 5,
    historicRevalidate: 1000000,
    fetchHistoricThreshold: async () => 10,
    fetchFirst: async () => 0,
    getKey: (s) => s,
    cacheFn: (fn, keys, { revalidate }) => {
      return async (...params) => {
        const cacheKey = stringifyJSON([...keys, ...params]);
        const cachedValue = cache.get(cacheKey);
        if (cachedValue && cachedValue.expire * 1000 > new Date().getTime()) {
          return parseJSON(cachedValue.value);
        } else {
          const res = await fn(...params);
          cache.set(cacheKey, {
            expire: new Date().getTime() + revalidate * 1000,
            value: stringifyJSON(res),
          });
          return res;
        }
      };
    },
  });

  const data1 = await helper.getData(5, 0);
  expect(data1).toStrictEqual([]);
  expect(reads).toStrictEqual([]);

  const data2 = await helper.getData(0, 1);
  expect(data2).toStrictEqual([]);
  expect(reads).toStrictEqual([]);
});
