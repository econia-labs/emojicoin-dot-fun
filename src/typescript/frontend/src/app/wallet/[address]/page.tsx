import { formatDisplayName, getAptosClient } from "@sdk/utils";
import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

const aptosClient = getAptosClient();

export interface CoinData {
  amount: number;
  coin_type: string;
  coin_info: {
    symbol: string;
    decimals: number;
  };
}

export interface FetchEmojicoinBalancesResponse {
  current_coin_balances: CoinData[];
}

export default async function WalletPage({ params }: { params: { address: string } }) {
  //const ownedTokens = await aptosClient.getAccountCoinsData({accountAddress: params.address, options: {limit: 100}});
  const ownedTokens: FetchEmojicoinBalancesResponse = await aptosClient.queryIndexer({
    query: {
      query: `query FetchEmojicoinBalances($address: String) {
  current_coin_balances(
    where: {owner_address: {_eq: $address}, coin_info: {coin_type: {_ilike: "%coin_factory::Emojicoin%"}}, amount: {_gt: "0"}}
    limit: 100
  ) {
    amount
    coin_type
    coin_info {
      symbol
      decimals
    }
  }
}
`,
      variables: { address: params.address },
    },
  });

  // Calculate price for each token. Use helper functions in src/typescript/sdk/src/indexer-v2/queries/app/home.ts to fetch market data. AI!

  return (
    <div className="max-w-[1000px] mx-auto">
      <span className="display-4">Emojicoins of {formatDisplayName(params.address)}</span>
      <WalletClientPage ownedCoins={ownedTokens.current_coin_balances} />
    </div>
  );
}
