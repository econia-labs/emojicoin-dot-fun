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

export async function fetchTokensPage(
  address: string,
  offset: number = 0,
  limit: number = 100
): Promise<FetchEmojicoinBalancesResponse> {
  return aptosClient.queryIndexer({
    query: {
      query: `query CoinsData($address: String, $offset: Int, $limit: Int) {
                current_fungible_asset_balances(
                  where: {owner_address: {_eq: $address}, metadata: {token_standard: {_eq: "v1"}}, amount: {_gt: "0"}, asset_type: {_ilike: "%coin_factory::Emojicoin%"}}
                  offset: $offset
                  limit: $limit
                ) {
                  amount
                  asset_type
                  metadata {
                    decimals
                    symbol
                  }
                }
              }
              `,
      variables: { address, offset, limit },
    },
  });
}

export async function fetchAllTokens(address: string): Promise<TokenData[]> {
  const limit = 100;
  let offset = 0;
  let allTokens: TokenData[] = [];
  let hasMore = true;

  while (hasMore) {
    const response = await fetchTokensPage(address, offset, limit);
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
