import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";
import getMaxPageNumber from "lib/utils/get-max-page-number";

import { RegistryView } from "@/move-modules";
import { fetchLargestMarketID } from "@/queries/home";
import { getAptosClient, toRegistryView } from "@/sdk/index";

import { MARKETS_PER_PAGE } from "./sorting/const";

export const fetchCachedNumRegisteredMarkets = unstableCacheWrapper(
  fetchLargestMarketID,
  ["num-registered-markets"],
  {
    revalidate: 10,
    tags: ["num-registered-markets"],
  }
);

export const fetchIsValidPageNumber = unstableCacheWrapper(
  // Page should be validated to be greater than 1 by this point.
  (page: number) =>
    RegistryView.view({
      aptos: getAptosClient(),
    })
      .then(toRegistryView)
      .then((r) => Number(r.numMarkets))
      .then((numMarkets) => {
        const isValid = page <= getMaxPageNumber(numMarkets, MARKETS_PER_PAGE);
        if (isValid) return true;
        throw new Error("Throwing an error to avoid POSTing to the cache.");
      }),
  ["fetch-is-valid-page-number"],
  {
    // Permanently cache this value since we throw if it's invalid.
    // This is because if it's valid, it's valid forever.
    revalidate: false,
    tags: ["fetch-is-valid-page-number"],
  }
);
