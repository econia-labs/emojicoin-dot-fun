"use server";

import { GEOBLOCKED, GEOBLOCKING_ENABLED } from "lib/server-env";
import { headers } from "next/headers";

export type Location = {
  countryCode: string | null;
  regionCode: string | null;
};

const isDisallowedLocation = ({ countryCode, regionCode }: Location) => {
  if (countryCode && GEOBLOCKED.countries.includes(countryCode)) {
    return true;
  }
  if (regionCode) {
    const isoCode = `${countryCode}-${regionCode}`;
    if (GEOBLOCKED.regions.includes(isoCode)) {
      return true;
    }
  }
  if (countryCode && !regionCode) {
    if (GEOBLOCKED.regions.map(r => r.split('-')[0]).includes(countryCode)) {
      return true;
    }
  }
  if (!countryCode && regionCode) {
    if (GEOBLOCKED.countries.includes(regionCode.split('-')[0])) {
      return true;
    }
  }
  return false;
};

export const isUserGeoblocked = async () => {
  if (!GEOBLOCKING_ENABLED) return false;
  const country = headers().get("x-vercel-ip-country");
  const region = headers().get("x-vercel-ip-country-region");
  if (typeof country !== "string" && typeof region !== "string") {
    return true;
  }
  return isDisallowedLocation({
    countryCode: country,
    regionCode: region,
  });
};
