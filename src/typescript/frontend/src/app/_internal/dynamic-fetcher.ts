import { getEnv } from "@vercel/functions";
import { IS_NEXT_BUILD_PHASE } from "lib/server-env";
import { NextResponse } from "next/server";
import type { SearchParamsRecord } from "utils/url-utils";
import { addSearchParams } from "utils/url-utils";

import { fetchArenaInfoJson } from "@/queries/arena";
import { fetchLargestMarketID } from "@/sdk/indexer-v2/queries";

import { fetchAptPrice } from "./apt-price/fetch";
import { fetchMeleeData } from "./arena/melee-data/fetches";
import { fetchPriceFeed } from "./price-feed/fetches";

const { VERCEL, VERCEL_URL } = getEnv();

const DEPLOYMENT_URL = VERCEL_URL ? `https://${VERCEL_URL}` : "http://localhost:3001";

/**
 * `args` must be named fields here or an empty object.
 */
type Callback = (args?: SearchParamsRecord | {}) => Promise<unknown>;

export function createDynamicFetcher<F extends Callback>({
  originFetch,
  routeName,
}: {
  originFetch: F;
  routeName: string;
}) {
  // Run the origin fetch at build time, as api endpoints possibly aren't available.
  if (IS_NEXT_BUILD_PHASE) {
    return originFetch;
  }

  const runtimeFetch = async (args?: Parameters<F>[0]) => {
    const baseUrl = new URL(`_internal/${routeName}`, DEPLOYMENT_URL);
    const url = addSearchParams(`${baseUrl}`, args ?? {});
    console.log("calling runtime fetch!", url);
    const res = await fetch(url, {
      headers: VERCEL
        ? {
            "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET || "",
          }
        : undefined,
      next: {
        // Mark it as internal so `next` doesn't try to cache it in on the CDN.
        // Note that this is still deduped as a request in memory, it just isn't stored on the CDN.
        internal: true,
        revalidate: 0,
      } as NextFetchRequestConfig,
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json() as ReturnType<F>;
  };

  return runtimeFetch as F;
}

export const PAIRS = {
  "apt-price": fetchAptPrice,
  "arena/info": fetchArenaInfoJson,
  "arena/melee-data": fetchMeleeData,
  "num-markets": fetchLargestMarketID,
  "price-feed": fetchPriceFeed,
} as const;

type CallbackNames = keyof typeof PAIRS;

type DynamicFetcherType = {
  [K in CallbackNames]: ReturnType<typeof createDynamicFetcher<(typeof PAIRS)[K]>>;
};

type RouteFetcherType = {
  [K in CallbackNames]: (
    args?: Parameters<(typeof PAIRS)[K]>[0]
  ) => Promise<NextResponse<Awaited<ReturnType<(typeof PAIRS)[K]>> | null>>;
};

export const DYNAMIC_FETCHERS = Object.fromEntries(
  Object.entries(PAIRS).map(
    ([routeName, cb]) => [routeName, createDynamicFetcher({ originFetch: cb, routeName })] as const
  )
) as DynamicFetcherType;

export const ROUTE_FETCHERS = Object.fromEntries(
  Object.entries(PAIRS).map(([routeName, cb]) => [
    routeName,
    async (args?: Parameters<typeof cb>[0]) => {
      const res = await cb(args).catch((e) => {
        console.error(e);
        return null;
      });
      try {
        return NextResponse.json(res);
      } catch (e) {
        console.error(e);
        return NextResponse.json(null);
      }
    },
  ])
) as RouteFetcherType;
