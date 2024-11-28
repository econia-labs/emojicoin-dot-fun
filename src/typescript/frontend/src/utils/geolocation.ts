"use server";

import { GEOBLOCKED, GEOBLOCKING_ENABLED } from "lib/server-env";
import { headers } from "next/headers";

export type Location = {
  countryCode: string;
  regionCode: string;
};

const isDisallowedLocation = ({ countryCode, regionCode }: Location) => {
  if (GEOBLOCKED.countries.includes(countryCode)) {
    return true;
  }
  const isoCode = `${countryCode}-${regionCode}`;
  if (GEOBLOCKED.regions.includes(isoCode)) {
    return true;
  }
  return false;
};

export const isUserGeoblocked = async () => {
  if (!GEOBLOCKING_ENABLED) return false;
  const country = headers().get("x-vercel-ip-country");
  const region = headers().get("x-vercel-ip-country-region");
  if (typeof country !== "string" || typeof region !== "string") {
    return true;
  }
  return isDisallowedLocation({
    countryCode: country,
    regionCode: region,
  });
};
