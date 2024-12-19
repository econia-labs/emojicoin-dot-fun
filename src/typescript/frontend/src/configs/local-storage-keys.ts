import { parseJSON, stringifyJSON } from "utils";
import packages from "../../package.json";
import { MS_IN_ONE_DAY } from "components/charts/const";
import { satisfies, type SemVer, parse } from "semver";

const LOCAL_STORAGE_KEYS = {
  theme: `${packages.name}_theme`,
  language: `${packages.name}_language`,
  geoblocking: `${packages.name}_geoblocking`,
  settings: `${packages.name}_settings`,
};

const LOCAL_STORAGE_VERSIONS: {
  [Property in keyof typeof LOCAL_STORAGE_KEYS]: SemVer;
} = {
  theme: parse("1.0.0")!,
  language: parse("1.0.0")!,
  geoblocking: parse("2.0.0")!,
  settings: parse("1.0.0")!,
};

export const LOCAL_STORAGE_CACHE_TIME: {
  [Property in keyof typeof LOCAL_STORAGE_KEYS]: number;
} = {
  theme: Infinity,
  language: Infinity,
  geoblocking: MS_IN_ONE_DAY,
  settings: Infinity,
};

export type LocalStorageCache<T> = {
  expiry: number;
  data: T | null;
  version: string | undefined;
};

export function readLocalStorageCache<T>(key: keyof typeof LOCAL_STORAGE_KEYS): T | null {
  const str = localStorage.getItem(LOCAL_STORAGE_KEYS[key]);
  if (str === null) {
    return null;
  }
  try {
    const cache = parseJSON<LocalStorageCache<T>>(str);
    const range = `~${LOCAL_STORAGE_VERSIONS[key].major}`;
    // Check for no breaking changes.
    if (!satisfies(cache.version ?? "1.0.0", range)) {
      console.warn(
        `${key} cache version not satisfied (needs to satisfy ${range}, but ${cache.version} is present). Purging...`
      );
      localStorage.delete(LOCAL_STORAGE_KEYS[key]);
      return null;
    }
    // Check for staleness.
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
    version: LOCAL_STORAGE_VERSIONS[key].version,
  };
  localStorage.setItem(LOCAL_STORAGE_KEYS[key], stringifyJSON<LocalStorageCache<T>>(cache));
}
