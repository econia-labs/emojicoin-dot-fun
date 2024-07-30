import { IPINFO_TOKEN } from "lib/env";

const COUNTRY_CACHING_DURATION = 1000 * 60 * 60 * 24; // One day
const COUNTRY_LOCALSTORAGE_KEY = "user-country";

type LocationCache = {
  country: string;
  expiry: number;
};

const isAllowedCountry = (country: string) => {
  return country !== "US" && country !== "KP" && country !== "IR";
};

export const isBanned = async () => {
  const cache = localStorage.getItem(COUNTRY_LOCALSTORAGE_KEY);

  if (cache) {
    const data: LocationCache = JSON.parse(cache);
    if (data.expiry > new Date().getTime()) {
      return !isAllowedCountry(data.country);
    }
  }

  const queryResult = await fetch(`https://ipinfo.io/json?token=${IPINFO_TOKEN}`)
    .then((res) => res.json())
    .then((res) => res.country);

  const data: LocationCache = {
    country: queryResult,
    expiry: new Date().getTime() + COUNTRY_CACHING_DURATION,
  };

  localStorage.setItem(COUNTRY_LOCALSTORAGE_KEY, JSON.stringify(data));

  return !isAllowedCountry(queryResult);
};
