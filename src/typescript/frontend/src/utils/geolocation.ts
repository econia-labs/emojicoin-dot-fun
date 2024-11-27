"use server";

import { GEOBLOCKED, GEOBLOCKING_ENABLED } from "lib/server-env";
import { headers } from "next/headers";

export type Location = {
  countryCode: string;
  regionCode: string;
};

const isDisallowedLocation = (location: Location) => {
  if (GEOBLOCKED.countries.includes(location.countryCode)) {
    return true;
  }
  const isoCode = `${location.countryCode}-${location.regionCode}`;
  if (GEOBLOCKED.regions.includes(isoCode)) {
    return true;
  }
  return false;
};

export const isUserGeoblocked = async () => {
  if (!GEOBLOCKING_ENABLED) return false;
  const country = headers().get('x-vercel-ip-country');
  const region = headers().get('x-vercel-ip-country-region');
  if (country === "undefined" || typeof country === "undefined" || country === "null" || country === null) {
    return true;
  }
  if (region === "undefined" || typeof region === "undefined" || region === "null" || region === null) {
    return true;
  }
  let location: Location;
  try {
    location = {
      countryCode: country,
      regionCode: region,
    };
  } catch (_) {
    return true;
  }
  return isDisallowedLocation(location);
};
