import { APTOS_NETWORK } from "lib/env";

function getRequestURL(address: string, isPrimary: boolean) {
  return isPrimary
    ? `https://www.aptosnames.com/api/${APTOS_NETWORK}/v1/primary-name/${address}`
    : `https://www.aptosnames.com/api/${APTOS_NETWORK}/v1/name/${address}`;
}

export const LOCALSTORAGE_ANS_KEY = "ans-names";
export const ANS_CACHE_TIME = 60 * 60 * 24 * 7 * 1000; // One week
export const MAX_ITEMS_IN_CACHE = 3000;

type ANSMap = Map<string, { name: string | null; isNull: boolean; expiry: number }>;
type ANSPromiseMap = Map<string, Promise<{ name: string | null; isNull: boolean; expiry: number }>>;

function serializeMap(map: ANSMap) {
  let array = Array.from(map.entries()).filter((a) => a[1].expiry > new Date().getTime());
  if (array.length > MAX_ITEMS_IN_CACHE) {
    array = array
      .sort((a, b) => a[1].expiry - b[1].expiry)
      .slice(array.length - MAX_ITEMS_IN_CACHE);
  }
  return JSON.stringify(array);
}

function deserializeMap(map: string): ANSMap {
  return new Map(JSON.parse(map));
}

// Do not expose this function to avoid using it in a for loop.
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

// A shared cache that is loaded from localStorage.
let ansMap: ANSMap;
const ramCacheString = localStorage.getItem(LOCALSTORAGE_ANS_KEY);
if (ramCacheString) {
  ansMap = deserializeMap(ramCacheString);
} else {
  ansMap = new Map();
}

// Stores promises to requests.
// This is used to avoid duplicating requests when two sources need the name of one address at the same time.
const ansPromiseMap: ANSPromiseMap = new Map();

// Get ANS names for given addresses.
// Returns a map that is guaranteed to have the requested addresses.
export async function getANSNames(addresses: string[]): Promise<Map<string, string>> {
  const res = new Map();

  for (const address of addresses) {
    const cachedValue = ansMap.get(address);
    if (cachedValue === undefined) {
      // If cache not hit
      let promise: Promise<{ name: string | null; isNull: boolean; expiry: number }>;
      if (ansPromiseMap.has(address)) {
        // Check if the request is already in progress
        promise = ansPromiseMap.get(address)!;
      } else {
        // If not, make the request
        const x = fetchANSName(address).then((res) => ({
          name: res,
          isNull: res === null,
          expiry: new Date().getTime() + ANS_CACHE_TIME,
        }));
        promise = x;
        ansPromiseMap.set(address, promise);
      }
      const fetchedRes = await promise;
      res.set(address, fetchedRes.name === null ? address : fetchedRes.name);
      ansMap.set(address, fetchedRes);
    } else if (!cachedValue.isNull) {
      res.set(address, cachedValue.name!);
    }
  }

  // Save the cache to localStorage only once after all the requests are done
  localStorage.setItem(LOCALSTORAGE_ANS_KEY, serializeMap(ansMap));

  return res;
}
