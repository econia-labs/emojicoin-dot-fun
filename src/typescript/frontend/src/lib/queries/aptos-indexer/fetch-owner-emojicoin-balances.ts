import { parseTypeTag } from "@aptos-labs/ts-sdk";
import { encodeEmojis, getSymbolEmojisInString } from "@sdk/emoji_data";
import { getEmojicoinMarketAddressAndTypeTags } from "@sdk/markets";

import {
  type AssetBalance,
  fetchEmojicoinBalances,
  type FetchFungibleAssetsParams,
} from "./fetch-emojicoin-balances";

/**
 * Fetch up to `max` (default: 1000) unique emojicoin balances for an address.
 *
 * @param ownerAddress the address to fetch balances for
 * @param max the max amount of unique coin balances to return
 * @returns up to `max` unique valid emojicoin balances for a user
 */
export async function fetchOwnerEmojicoinBalances({
  ownerAddress,
  // Fetch at most 1000 by default, which corresponds to 10 requests.
  max = 1000,
}: { max?: number } & Omit<FetchFungibleAssetsParams, "offset" | "limit">): Promise<
  AssetBalance[]
> {
  const limit = 100;
  let offset = 0;
  let allTokens: AssetBalance[] = [];
  let hasMore = true;

  while (hasMore && offset < max) {
    const response = await fetchEmojicoinBalances({ ownerAddress, offset, limit });
    const tokens = response.current_fungible_asset_balances;
    allTokens = [...allTokens, ...tokens];

    // If we got less than the limit, we've reached the end.
    hasMore = tokens.length === limit;
    if (hasMore) {
      offset += limit;
    }
  }

  // Filter out non-emojicoin balances.
  return allTokens.filter((token) => {
    // Ensure the entire symbol matches a valid emojicoin symbol by checking the length before
    // and after parsing the string for valid symbol emojis.
    const onlyValidEmojis = getSymbolEmojisInString(token.metadata.symbol);
    if (onlyValidEmojis.join("") !== token.metadata.symbol) return false;

    const symbolBytes = encodeEmojis(onlyValidEmojis);
    const { emojicoin } = getEmojicoinMarketAddressAndTypeTags({ symbolBytes });
    return emojicoin.toString() === parseTypeTag(token.asset_type).toString();
  });
}
