// cspell:word ilike

import { encodeEmojis } from "@sdk/emoji_data";
import { getEmojicoinMarketAddressAndTypeTags } from "@sdk/markets";
import { getAptosClient } from "@sdk/utils";

const aptosClient = getAptosClient();

export type TokenData = {
  amount: string;
  asset_type: string;
  metadata: {
    symbol: string;
    decimals: number;
  };
};

export type FetchEmojicoinBalancesResponse = {
  current_fungible_asset_balances: TokenData[];
};

export type FetchFungibleAssetsParams = {
  ownerAddress?: string;
  // Can be used to fetch holders of specific coin.
  assetType?: string;
  offset?: number;
  limit?: number;
};

export async function fetchFungibleAssetsBalance({
  ownerAddress,
  assetType,
  offset = 0,
  limit = 100,
}: FetchFungibleAssetsParams): Promise<FetchEmojicoinBalancesResponse> {
  const conditions = ['{ metadata: {token_standard: {_eq: "v1"}} }', '{ amount: {_gt: "0"} }'];

  if (assetType) conditions.push("{ asset_type: {_eq: $assetType} }");
  else conditions.push('{ asset_type: {_ilike: "%coin_factory::Emojicoin%"} }');

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
        ownerAddress,
        offset,
        limit,
        assetType,
      },
    },
  });
}

export async function fetchAllFungibleAssetsBalance({
  ownerAddress,
  assetType,
  // Fetch at most 1000 by default, which corresponds to 10 requests.
  max = 1000,
}: { max?: number } & Omit<FetchFungibleAssetsParams, "offset" | "limit">): Promise<TokenData[]> {
  const limit = 100;
  let offset = 0;
  let allTokens: TokenData[] = [];
  let hasMore = true;

  while (hasMore && offset < max) {
    const response = await fetchFungibleAssetsBalance({ ownerAddress, offset, limit, assetType });
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
    const address = getEmojicoinMarketAddressAndTypeTags({
      symbolBytes: encodeEmojis([...token.metadata.symbol]),
    });
    return address.emojicoin.toString() === token.asset_type;
  });
}
