import { LazyPromise } from "@sdk/utils";
import { GEOBLOCKING_ENABLED } from "lib/env";

const COUNTRY_CACHING_DURATION = 1000 * 60 * 60 * 24; // One day.
const COUNTRY_LOCALSTORAGE_KEY = "user-country";
export const COUNTRY_UNKNOWN = "unknown";

type LocationCache = {
  country: string;
  expiry: number;
};

const isAllowedCountry = (country: string) => {
  return country !== "US" && country !== "KP" && country !== "IR" && country !== COUNTRY_UNKNOWN;
};

const getCountry: () => Promise<string> = async () => {
  const cache = localStorage.getItem(COUNTRY_LOCALSTORAGE_KEY);

  if (cache) {
    const data: LocationCache = JSON.parse(cache);
    if (data.expiry > new Date().getTime()) {
      return data.country;
    }
  }

  const queryResult = await fetch("/geolocation").then((res) => res.text());

  const data: LocationCache = {
    country: queryResult,
    expiry: new Date().getTime() + COUNTRY_CACHING_DURATION,
  };

  localStorage.setItem(COUNTRY_LOCALSTORAGE_KEY, JSON.stringify(data));

  return queryResult;
};

const country: LazyPromise<string> = new LazyPromise(() => getCountry());

export const isBanned = async () => {
  if (!GEOBLOCKING_ENABLED) return false;
  return !isAllowedCountry(await country.get());
};
