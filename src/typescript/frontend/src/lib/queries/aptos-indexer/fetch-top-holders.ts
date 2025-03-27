"use server";

import { AccountAddress } from "@aptos-labs/ts-sdk";
import { unstable_cache } from "next/cache";

import { toCoinTypes } from "@/sdk/markets";

import { fetchEmojicoinBalances } from "./fetch-emojicoin-balances";

async function fetchTopHoldersInternal(marketAddress: `0x${string}`) {
  const { emojicoin } = toCoinTypes(marketAddress);
  const holders = await fetchEmojicoinBalances({ assetType: emojicoin });

  // Exclude the emojicoin market address from the holders list.
  const market = AccountAddress.from(marketAddress);
  return holders.current_fungible_asset_balances.filter(
    (h) => !market.equals(AccountAddress.from(h.owner_address))
  );
}

/**
 * The cached version of {@link fetchTopHoldersInternal}.
 */
export const fetchCachedTopHolders = unstable_cache(fetchTopHoldersInternal, ["fetch-holders"], {
  revalidate: 10,
});
