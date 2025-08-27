import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { RegistryView } from "@/move-modules";
import { getAptosClient, toRegistryView } from "@/sdk/index";

export const fetchNumRegisteredMarkets = () =>
  RegistryView.view({
    aptos: getAptosClient(),
  })
    .then(toRegistryView)
    .then((r) => Number(r.numMarkets));

export const fetchCachedNumRegisteredMarkets = unstableCacheWrapper(
  // Page should be validated to be greater than 1 by this point.
  fetchNumRegisteredMarkets,
  "num-registered-markets",
  { revalidate: 10 }
);
