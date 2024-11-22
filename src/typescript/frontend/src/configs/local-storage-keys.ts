import { parseJSON, stringifyJSON } from "utils";
import packages from "../../package.json";

const LOCAL_STORAGE_KEYS = {
  theme: `${packages.name}_theme`,
  language: `${packages.name}_language`,
  geoblocking: `${packages.name}_geoblocking`,
  settings: `${packages.name}_geoblocking`,
};

const LOCAL_STORAGE_CACHE_TIME = {
  theme: Infinity,
  language: Infinity,
  geoblocking: 7 * 24 * 60 * 60 * 1000, // 7 days.
  settings: Infinity, // 7 days.
};

export type LocalStorageCache<T> = {
  expiry: number;
  data: T | null;
};

/**
 * Note that this data is not validated and any change in data type returned from this function
 * should be validated to ensure that persisted cache data between multiple builds can cause errors
 * with unexpected data types.
 */
export function readLocalStorageCache<T>(key: keyof typeof LOCAL_STORAGE_KEYS): T | null {
  const str = localStorage.getItem(LOCAL_STORAGE_KEYS[key]);
  if (str === null) {
    return null;
  }
  const cache = parseJSON<LocalStorageCache<T>>(str);
  try {
    if (new Date(cache.expiry) > new Date()) {
      return cache.data;
    }
  } catch (e) {
    return null;
  }
  return null;
}

export function writeLocalStorageCache<T>(key: keyof typeof LOCAL_STORAGE_KEYS, data: T) {
  const cache: LocalStorageCache<T> = {
    expiry: new Date().getTime() + LOCAL_STORAGE_CACHE_TIME[key],
    data,
  };
  localStorage.setItem(LOCAL_STORAGE_KEYS[key], stringifyJSON<LocalStorageCache<T>>(cache));
}
