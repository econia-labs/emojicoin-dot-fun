const COUNTRY_CACHING_DURATION = 1000 * 60 * 60 * 24; // One day
const COUNTRY_LOCALSTORAGE_KEY = "user-country";

type LocationCache = {
  country: string,
  expiry: number,
}

const isAllowedCountry = (country: string) => {
  return country !== "US" && country !== "KP" && country !== "IR";
}

export const isBanned = () => {
  const cache = localStorage.getItem(COUNTRY_LOCALSTORAGE_KEY);

  if(cache) {
    const data: LocationCache = JSON.parse(cache);
    if(data.expiry > new Date().getTime()) {
      return !isAllowedCountry(data.country);
    }
  }

  const queryResult = "US";

  const data: LocationCache = {
    country: queryResult,
    expiry: new Date().getTime() + COUNTRY_CACHING_DURATION,
  }

  localStorage.setItem(COUNTRY_LOCALSTORAGE_KEY, JSON.stringify(data));

  return isAllowedCountry(queryResult);
}



