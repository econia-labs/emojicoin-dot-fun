import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { APTOS_NETWORK } from "lib/env";
import { MS_IN_ONE_DAY } from "components/charts/const";

export type ANSValue = { name: string | null; expiry: number };
export type ANSMap = Map<string, ANSValue>;
export type ANSPromiseMap = Map<string, Promise<void>>;
export type NameState = {
  names: ANSMap;
};
export type NameActions = {
  /**
   * Resolves an ANS name for an address. If it's not in local storage, it will be fetched.
   *
   * It will return the input address if no name is found.
   * It will return a name otherwise.
   */
  resolveAddress: (address: string) => void;
};
export type NameStore = NameState & NameActions;

export const LOCALSTORAGE_ANS_KEY = `${APTOS_NETWORK}-ans-names`;
// Cache resolved names for one week.
export const ANS_CACHE_TIME = MS_IN_ONE_DAY * 7;
// Cache unresolved names for one day. Otherwise people who register new names wouldn't see them
// get updated for a week.
export const ANS_NULL_CACHE_TIME = MS_IN_ONE_DAY;
export const MAX_ITEMS_IN_CACHE = 3000;

/**
 * Stores promises to requests.
 *
 * This is used to avoid duplicating requests when two sources need the name of one address at the same time.
 */
const ansPromiseMap: ANSPromiseMap = new Map();

function getRequestURL(address: string, isPrimary: boolean) {
  return isPrimary
    ? `https://www.aptosnames.com/api/${APTOS_NETWORK}/v1/primary-name/${address}`
    : `https://www.aptosnames.com/api/${APTOS_NETWORK}/v1/name/${address}`;
}

/**
 * Saves the ANSMap to localStorage.
 *
 * Removes outdated values by the way.
 */
export function saveANSMap(map: ANSMap) {
  const now = new Date().getTime();
  const notExpired = (entry: [string, ANSValue]) => entry[1].expiry > now;

  const entries = Array.from(map.entries())
    .filter(notExpired)
    .sort((a, b) => b[1].expiry - a[1].expiry)
    .slice(0, MAX_ITEMS_IN_CACHE);

  const serializedMap = JSON.stringify(entries);

  localStorage.setItem(LOCALSTORAGE_ANS_KEY, serializedMap);
}

/** Loads the ANSMap from localStorage. */
export function loadANSMap(): ANSMap {
  const map = localStorage.getItem(LOCALSTORAGE_ANS_KEY);
  if (map) {
    return new Map(JSON.parse(map));
  } else {
    return new Map();
  }
}

/**
 * Get the name of an address.
 *
 * Returns null if the address has no registered name.
 *
 * Do not expose this function to avoid using it in a for loop.
 */
async function fetchANSName(address: string): Promise<string | null> {
  const primaryNameUrl = getRequestURL(address, true);

  try {
    const { name: primaryName } = await fetch(primaryNameUrl).then((res) => res.json());

    if (primaryName) {
      return primaryName;
    } else {
      const nameUrl = getRequestURL(address, false);

      if (!nameUrl) {
        return null;
      }

      const { name } = await fetch(nameUrl).then((res) => res.json());
      if (name) {
        return name;
      }
      return null;
    }
  } catch (_) {
    return null;
  }
}

export const initializeEventStore = (): NameState => {
  if (typeof localStorage !== "undefined") {
    return { names: loadANSMap() };
  } else {
    return { names: new Map() };
  }
};

export const defaultState: NameState = initializeEventStore();

export const createNameStore = (initialState: NameState = defaultState) => {
  return createStore<NameStore>()(
    immer((set, get) => ({
      ...initialState,
      resolveAddress: (address) => {
        if (get().names.has(address)) {
          return;
        }
        if (!ansPromiseMap.has(address)) {
          const ansPromise = fetchANSName(address)
            .then((res) => ({
              name: res,
              expiry: new Date().getTime() + (res ? ANS_CACHE_TIME : ANS_NULL_CACHE_TIME),
            }))
            .then((ansValue) => {
              set((state) => {
                state.names.set(address, ansValue);
                ansPromiseMap.delete(address);
                if (ansPromiseMap.size === 0) {
                  saveANSMap(state.names);
                }
              });
            });
          ansPromiseMap.set(address, ansPromise);
        }
      },
    }))
  );
};
