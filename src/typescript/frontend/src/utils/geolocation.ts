import { GEOBLOCKED, GEOBLOCKING_ENABLED, VPNAPI_IO_API_KEY } from "lib/server-env";

export type Location = {
  country: string;
  region: string;
  countryCode: string;
  regionCode: string;
  vpn: boolean;
};

const isAllowedLocation = (location: Location) => {
  if (GEOBLOCKED.countries.includes(location.countryCode)) {
    return false;
  }
  const isoCode = `${location.countryCode}-${location.regionCode}`;
  if (GEOBLOCKED.regions.includes(isoCode)) {
    return false;
  }
  return true;
};

export const isBanned = async (ip: string | undefined | null) => {
  if (!GEOBLOCKING_ENABLED) return false;
  if (ip === "undefined" || typeof ip === "undefined" || ip === "null" || ip === null) {
    return true;
  }
  let location: Location;
  try {
    location = await getLocation(ip);
  } catch (_) {
    return true;
  }
  if (location.vpn) {
    return true;
  }
  const res = !isAllowedLocation(location);
  return res;
};

const ONE_DAY = 604800;

const getLocation: (ip: string) => Promise<Location> = async (ip) => {
  if (ip === "undefined" || typeof ip === "undefined") {
    throw "IP is undefined";
  }
  const queryResult = await fetch(`https://vpnapi.io/api/${ip}?key=${VPNAPI_IO_API_KEY}`, {
    next: { revalidate: ONE_DAY },
  }).then((res) => res.json());

  const data = {
    country: queryResult.location.country,
    region: queryResult.location.region,
    countryCode: queryResult.location.country_code,
    regionCode: queryResult.location.region_code,
    vpn: queryResult.security.vpn,
  };

  return data;
};
