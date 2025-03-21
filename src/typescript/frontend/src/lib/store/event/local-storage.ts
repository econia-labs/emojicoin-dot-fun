import { type EventModelWithMarket } from "@sdk/indexer-v2";
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

const shouldKeep = (e: EventModelWithMarket) => {
  const now = new Date().getTime();
  // The time at which all events that occurred prior to are considered stale.
  const staleTimeBoundary = new Date(now - LOCAL_STORAGE_EXPIRATION_TIME);
  return e.transaction.timestamp > staleTimeBoundary;
};

export const maybeUpdateLocalStorage = (
  update: boolean,
  key: EventLocalStorageKey,
  event: EventModelWithMarket
) => {
  if (!update) return;
  const str = localStorage.getItem(key) ?? "[]";
  const data: EventModelWithMarket[] = parseJSON(str);
  data.unshift(event);
  localStorage.setItem(key, stringifyJSON(data));
};

export const cleanReadLocalStorage = (key: EventLocalStorageKey) => {
  const str = localStorage.getItem(key) ?? "[]";
  const data: EventModelWithMarket[] = parseJSON(str);
  const relevantItems = data.filter(shouldKeep);
  localStorage.setItem(key, stringifyJSON(relevantItems));
  return relevantItems;
};

export const clearLocalStorage = (key: EventLocalStorageKey) => {
  localStorage.setItem(key, "[]");
};
