"use server";

import { ecFetch } from "lib/ecFetch/ecFetch";
import { unstable_cache } from "next/cache";

export const fetchBlockHeight = async () => {
  return ecFetch<{ block_height: string }>("https://api.mainnet.aptoslabs.com/v1/", {
    next: { revalidate: 20 },
  });
};

export const fetchBlockHeightUnstableCache = unstable_cache(
  async () => fetch("https://api.mainnet.aptoslabs.com/v1/").then((res) => res.json()),
  ["fetchTimestamp"],
  {
    revalidate: 30,
  }
);
