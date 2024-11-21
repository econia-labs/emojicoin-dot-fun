import { parseJSON, stringifyJSON } from "utils";
import packages from "../../package.json";

const LOCAL_STORAGE_KEYS = {
  theme: `${packages.name}_theme`,
  language: `${packages.name}_language`,
  geoblocking: `${packages.name}_geoblocking`,
};

const LOCAL_STORAGE_CACHE_TIME = {
  theme: Infinity,
  language: Infinity,
  geoblocking: 7 * 24 * 60 * 60 * 1000, // 7 days.
};

export type LocalStorageCache<T> = {
  expiry: number;
  data: T | null;
};

export function readLocalStorageCache<T>(key: keyof typeof LOCAL_STORAGE_KEYS): T | null {
  const str = localStorage.getItem(key);
  if (str === null) {
    return null;
  }
  const cache = parseJSON<LocalStorageCache<T>>(str);
  if (new Date(cache.expiry) > new Date()) {
    return cache.data;
  }
  return null;
}

export function writeLocalStorageCache<T>(key: keyof typeof LOCAL_STORAGE_KEYS, data: T) {
  const cache: LocalStorageCache<T> = {
    expiry: new Date().getTime() + LOCAL_STORAGE_CACHE_TIME[key],
    data,
  };
  localStorage.setItem(key, stringifyJSON<LocalStorageCache<T>>(cache));
}
