import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { RegistryView } from "@/move-modules";
import { getAptosClient, toRegistryView } from "@/sdk/index";

export const fetchCachedNumRegisteredMarkets = unstableCacheWrapper(
  // Page should be validated to be greater than 1 by this point.
  () =>
    RegistryView.view({
      aptos: getAptosClient(),
    })
      .then(toRegistryView)
      .then((r) => Number(r.numMarkets)),
  ["fetch-is-valid-page-number"],
  {
    revalidate: 10,
    tags: ["num-registered-markets"],
  }
);
