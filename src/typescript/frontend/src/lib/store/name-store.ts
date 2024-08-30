import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { APTOS_NETWORK } from "lib/env";
import type { WritableDraft } from "immer";

export type ANSValue = { name: string | null; expiry: number };
export type ANSMap = Map<string, ANSValue>;
export type ANSPromiseMap = Map<string, Promise<void>>;

export type NameState = {
  names: ANSMap;
};
export type NameActions = {
  /**
   * Return a map of addresses to names.
   *
   * The returned map might not contain the values right away, as it takes time to make network requests.
   */
  getMapWithNames: (addresses: string[]) => ANSMap;
  /**
   * Return a function that takes an address and returns the text identifying the wallet.
   *
   * It will return the address if no name is found.
   * It will return a name otherwise.
   *
   * The returned function might not be able to resolve all names right away, as it takes time to make network requests.
   */
  getResolverWithNames: (addresses: string[]) => (address: string) => string;
};
export type NameStore = NameState & NameActions;

export const LOCALSTORAGE_ANS_KEY = `${APTOS_NETWORK}-ans-names`;
export const ANS_CACHE_TIME = 60 * 60 * 24 * 7 * 1000; // One week
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

type Set = (
  nextStateOrUpdater: NameStore | Partial<NameStore> | ((state: WritableDraft<NameStore>) => void),
  shouldReplace?: boolean | undefined
) => void;
type Get = () => NameStore;

const getNameMap = (set: Set, get: Get, addresses: string[]): ANSMap => {
  const map = get().names;
  const uncachedNames: string[] = [];
  for (const address of addresses) {
    if (!map.has(address)) {
      uncachedNames.push(address);
    }
  }
  if (uncachedNames.length > 0) {
    for (const address of uncachedNames) {
      if (!ansPromiseMap.has(address)) {
        const x = fetchANSName(address)
          .then((res) => ({
            name: res,
            expiry: new Date().getTime() + ANS_CACHE_TIME,
          }))
          .then((res) => {
            set((state) => {
              state.names.set(address, res);
              ansPromiseMap.delete(address);
              if (ansPromiseMap.size === 0) {
                saveANSMap(state.names);
              }
            });
          });
        ansPromiseMap.set(address, x);
      }
    }
  }
  return get().names;
};

export const createNameStore = (initialState: NameState = defaultState) => {
  return createStore<NameStore>()(
    immer((set, get) => ({
      ...initialState,
      getMapWithNames: (addresses) => {
        return getNameMap(set, get, addresses);
      },
      getResolverWithNames: (addresses) => {
        const map = getNameMap(set, get, addresses);
        return (address) => map.get(address)?.name ?? address;
      },
    }))
  );
};
