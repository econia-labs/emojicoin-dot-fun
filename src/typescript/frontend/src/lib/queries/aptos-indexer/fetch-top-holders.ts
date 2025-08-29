import "server-only";

import { AccountAddress } from "@aptos-labs/ts-sdk";
import { unstableCacheWrapper } from "lib/nextjs/unstable-cache-wrapper";

import { toEmojicoinTypes } from "@/sdk/markets";
import type { CoinTypeString } from "@/sdk/utils";

import { fetchEmojicoinBalances } from "./fetch-emojicoin-balances";

export async function fetchTopHoldersInternal(marketAddress: `0x${string}`) {
  const { emojicoin } = toEmojicoinTypes(marketAddress);
  const assetType = emojicoin.toString() as CoinTypeString;
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
export const fetchCachedTopHolders = unstableCacheWrapper(
  fetchTopHoldersInternal,
  "fetch-top-holders",
  { revalidate: 60 }
);
