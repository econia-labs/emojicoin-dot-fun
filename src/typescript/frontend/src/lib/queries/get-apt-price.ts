"use server";

import { COINMARKETCAP_API_KEY } from "lib/server-env";
import { unstable_cache } from "next/cache";

const COINMARKETCAP_APT_ID = "21794";
const COINMARKETCAP_ROOT_URL = "https://pro-api.coinmarketcap.com";
const COINMARKETCAP_ENDPOINT = "v2/cryptocurrency/quotes/latest";

export const getAptPrice = unstable_cache(
  async () =>
    fetch(`${COINMARKETCAP_ROOT_URL}/${COINMARKETCAP_ENDPOINT}?id=${COINMARKETCAP_APT_ID}`, {
      headers: {
        Accept: "application/json",
        "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY,
      },
    })
      .then((r) => r.json())
      .then((r) => r.data[COINMARKETCAP_APT_ID].quote.USD.price as number),
  ["apt-price"],
  { revalidate: 60 * 10 } // Ten minutes
);
