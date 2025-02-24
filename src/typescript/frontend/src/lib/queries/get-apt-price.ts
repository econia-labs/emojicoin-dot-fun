"use server";

import { COINGECKO_API_KEY } from "lib/server-env";
import { unstable_cache } from "next/cache";

const COINGECKO_APT_ID = "aptos";
const COINGECKO_ROOT_URL = "https://pro-api.coingecko.com/api";
const COINGECKO_ENDPOINT = "v3/simple/price";
const COINGECKO_PARAMS = "vs_currencies=usd&precision=4";

export const getAptPrice = unstable_cache(
  async () =>
    fetch(
      `${COINGECKO_ROOT_URL}/${COINGECKO_ENDPOINT}` +
        `?ids=${COINGECKO_APT_ID}&${COINGECKO_PARAMS}`,
      {
        headers: {
          Accept: "application/json",
          "x-cg-pro-api-key": COINGECKO_API_KEY,
        },
      }
    )
      .then(async (r) => {
        if (r.ok) return r.json();
        throw new Error(r.statusText + " " + JSON.stringify(await r.json()));
      })
      .then((r) => r.aptos.usd as number)
      .catch((e) => {
        console.error("Could not get APT price from CoinGecko.", e);
        return undefined;
      }),
  ["apt-price"],
  { revalidate: 10 } // Ten seconds.
);
