import { type AnyEventModel } from "@sdk/indexer-v2/types";
import { parseJSON, stringifyJSON } from "utils";

export const LOCAL_STORAGE_EXPIRATION_TIME = 1000 * 60; // 10 minutes.

export const LOCAL_STORAGE_EVENT_TYPES = [
  "swap",
  "chat",
  "liquidity",
  "market",
  "periodic",
] as const;
type EventLocalStorageKey = (typeof LOCAL_STORAGE_EVENT_TYPES)[number];

const shouldKeep = (e: AnyEventModel) => {
  const now = new Date().getTime();
  // The time at which all events that occurred prior to are considered stale.
  const staleTimeBoundary = new Date(now - LOCAL_STORAGE_EXPIRATION_TIME);
  return e.transaction.timestamp > staleTimeBoundary;
};

export const updateLocalStorage = (key: EventLocalStorageKey, event: AnyEventModel) => {
  const str = localStorage.getItem(key) ?? "[]";
  const data: AnyEventModel[] = parseJSON(str);
  data.unshift(event);
  localStorage.setItem(key, stringifyJSON(data));
};

export const cleanReadLocalStorage = (key: EventLocalStorageKey) => {
  const str = localStorage.getItem(key) ?? "[]";
  const data: AnyEventModel[] = parseJSON(str);
  const relevants = data.filter(shouldKeep);
  localStorage.setItem(key, stringifyJSON(relevants));
  return relevants;
};

export const clearLocalStorage = (key: EventLocalStorageKey) => {
  localStorage.setItem(key, "[]");
};
