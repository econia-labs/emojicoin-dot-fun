// cspell:word ilike
import { AccountAddress } from "@aptos-labs/ts-sdk";
import { getAptosClient, removeLeadingZerosFromStructString } from "@sdk/utils";

export type AssetBalance = {
  amount: string;
  asset_type: string;
  owner_address: string;
  metadata: {
    symbol: string;
    decimals: number;
  };
};

type FetchEmojicoinBalancesResponse = {
  current_fungible_asset_balances: AssetBalance[];
};

export type FetchFungibleAssetsParams = {
  ownerAddress?: string;
  assetType?: `0x${string}::${string}::${string}`;
  offset?: number;
  limit?: number;
};

/**
 * Fetches emojicoin asset balances from the Aptos GraphQL indexer.
 *
 * It is expected that you pass the `assetType` or `ownerAddress` mutually exclusively.
 *
 * If neither are passed, it will fetch all emojicoins from all accounts.
 *
 * - Includes `::Emojicoin` coins and fungible assets.
 * - Does not include any `::EmojicoinLP` assets.
 *
 * @param assetType a type tag that matches the form `0x${string}::${string}::${string}
 * Pass this to fetch the holders of a specific coin. If this is omitted, it will fetch all
 * emojicoin balances that match ::coin_factory::Emojicoin
 * @param ownerAddress an account address that matches the form `0x${string}. Pass this to fetch the
 * balance of an account.
 */
export async function fetchEmojicoinBalances({
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

  return getAptosClient().queryIndexer({
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
        ownerAddress: ownerAddress ? AccountAddress.from(ownerAddress).toString() : undefined,
        offset,
        limit,
        // The Aptos indexer expects the asset type address to be in short format (ex: 0x00b -> 0xb).
        assetType: assetType ? removeLeadingZerosFromStructString(assetType) : undefined,
      },
    },
  });
}
