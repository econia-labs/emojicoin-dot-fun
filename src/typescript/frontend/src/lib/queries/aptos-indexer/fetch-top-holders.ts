"use server";

import { AccountAddress } from "@aptos-labs/ts-sdk";
import { toCoinTypes } from "@sdk/markets";
import { unstable_cache } from "next/cache";

import { fetchEmojicoinBalances } from "./fetch-emojicoin-balances";

async function fetchTopHoldersInternal(marketAddress: `0x${string}`) {
  const { emojicoin } = toCoinTypes(marketAddress);
  if (!emojicoin.isStruct()) {
    console.error(`Invalid market address passed to \`fetchHoldersInternal\`: ${marketAddress}`);
    return [];
  }
  const assetType = emojicoin.toString();
  const holders = await fetchEmojicoinBalances({ assetType });

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
