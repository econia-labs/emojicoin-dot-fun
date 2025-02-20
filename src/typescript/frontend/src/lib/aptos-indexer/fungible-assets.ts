// cspell:word ilike

import { AccountAddress, parseTypeTag } from "@aptos-labs/ts-sdk";
import { encodeEmojis, getSymbolEmojisInString } from "@sdk/emoji_data";
import { getEmojicoinMarketAddressAndTypeTags, toCoinTypes } from "@sdk/markets";
import { getAptosClient } from "@sdk/utils";
import { unstable_cache } from "next/cache";

const aptosClient = getAptosClient();

export type TokenBalance = {
  amount: string;
  asset_type: string;
  owner_address: string;
  metadata: {
    symbol: string;
    decimals: number;
  };
};

export type FetchEmojicoinBalancesResponse = {
  current_fungible_asset_balances: TokenBalance[];
};

export type FetchFungibleAssetsParams = {
  ownerAddress?: string;
  // Can be used to fetch holders of specific coin.
  assetType?: string;
  offset?: number;
  limit?: number;
};

// Removes leading zeroes from address (ex: 0x00b -> 0xb)
const shortAddress = (address: `0x${string}`) =>
  address.toString().replace(/^0x0*([0-9a-fA-F]+)$/, "0x$1");

/**
 * @param assetType a type tag that matches the form `0x${string}::${string}::${string}
 * @throws if `assetType` is not a TypeTagStruct type
 * @returns a coin type tag with no leading zeros
 */
const formatAssetTypeForIndexer = (assetType: string) => {
  const typeTag = parseTypeTag(assetType);
  if (!typeTag.isStruct()) {
    throw new Error("Invalid coin type tag.");
  }

  const { address, moduleName, name } = typeTag.value;

  return `${shortAddress(address.toString())}::${moduleName.identifier}::${name.identifier}`;
};

/**
 * @param assetType a type tag that matches the form `0x${string}::${string}::${string}
 * Pass this to fetch the holders of a specific coin. If this is omitted, it will fetch all emojicoin balances that match ::coin_factory::Emojicoin
 * @param ownerAddress an account address that matches the form `0x${string}. Pass this to fetch the balance of an account
 * You should usually pass one or the other. If none of these are passed, it will fetch all emojicoins from all accounts.
 */
async function fetchFungibleAssetsBalance({
  ownerAddress,
  assetType,
  offset = 0,
  limit = 100,
}: FetchFungibleAssetsParams): Promise<FetchEmojicoinBalancesResponse> {
  const conditions = ['{ metadata: {token_standard: {_eq: "v1"}} }', '{ amount: {_gt: "0"} }'];

  if (assetType) conditions.push("{ asset_type: {_eq: $assetType} }");
  else conditions.push('{ asset_type: {_ilike: "%::coin_factory::Emojicoin"} }');

  if (ownerAddress) {
    conditions.push("{ owner_address: {_eq: $ownerAddress} }");
  }

  return aptosClient.queryIndexer({
    query: {
      query: `
        query CoinsData($ownerAddress: String, $assetType: String, $offset: Int, $limit: Int) {
          current_fungible_asset_balances(
            where: {
              _and: [${conditions.join(",")}]
            }
            offset: $offset
            limit: $limit
          ) {
            owner_address
            amount
            asset_type
            metadata {
              decimals
              symbol
            }
          }
        }`,
      variables: {
        ownerAddress: ownerAddress ? AccountAddress.from(ownerAddress) : undefined,
        offset,
        limit,
        // The Aptos indexer expects the asset type address to be in short format (ex: 0x00b -> 0xb).
        assetType: assetType ? formatAssetTypeForIndexer(assetType) : undefined,
      },
    },
  });
}

export async function fetchAllFungibleAssetsBalance({
  ownerAddress,
  // Fetch at most 1000 by default, which corresponds to 10 requests.
  max = 1000,
}: { max?: number } & Omit<FetchFungibleAssetsParams, "offset" | "limit">): Promise<
  TokenBalance[]
> {
  const limit = 100;
  let offset = 0;
  let allTokens: TokenBalance[] = [];
  let hasMore = true;

  while (hasMore && offset < max) {
    const response = await fetchFungibleAssetsBalance({ ownerAddress, offset, limit });
    const tokens = response.current_fungible_asset_balances;
    allTokens = [...allTokens, ...tokens];

    // If we got less than the limit, we've reached the end.
    hasMore = tokens.length === limit;
    if (hasMore) {
      offset += limit;
    }
  }

  // Filter out non-emojicoin tokens.
  return allTokens.filter((token) => {
    // The purpose of this is just to make sure we're passing a valid value to getEmojicoinMarketAddressAndTypeTags.
    const symbolEmojis = getSymbolEmojisInString(token.metadata.symbol);
    if (!symbolEmojis.length) return false;
    const address = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: encodeEmojis(symbolEmojis),
    });
    return address.emojicoin.toString() === parseTypeTag(token.asset_type).toString();
  });
}

async function fetchHoldersInternal(marketAddress: `0x${string}`) {
  const address = AccountAddress.from(marketAddress).toString();
  const holders = await fetchFungibleAssetsBalance({
    assetType: toCoinTypes(marketAddress).emojicoin.toString(),
  });
  // Exclude the factory address from the holders list.
  return holders.current_fungible_asset_balances.filter(
    (h) => AccountAddress.from(h.owner_address).toString() !== address
  );
}

export const fetchCachedHolders = unstable_cache(fetchHoldersInternal, ["fetch-holders"], {
  revalidate: 60,
});
