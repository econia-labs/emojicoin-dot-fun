"use server";

import { ecFetch } from "lib/ecFetch/ecFetch";
import { COINGECKO_API_KEY } from "lib/server-env";

const COINGECKO_APT_ID = "aptos";
const COINGECKO_ROOT_URL = "https://pro-api.coingecko.com/api";
const COINGECKO_ENDPOINT = "v3/simple/price";

export const getAptPrice = async () =>
  ecFetch<{ aptos: { usd: number } }>(`${COINGECKO_ROOT_URL}/${COINGECKO_ENDPOINT}`, {
    searchParams: {
      ids: COINGECKO_APT_ID,
      vs_currencies: "usd",
      precision: 4,
    },
    headers: {
      "x-cg-pro-api-key": COINGECKO_API_KEY,
    },
    next: {
      revalidate: 10,
    },
  })
    .then((r) => r.aptos.usd as number)
    .catch((e) => {
      console.error("Could not get APT price from CoinGecko.", e);
      return undefined;
    });
