import { getAptosClient } from "@sdk/utils";
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

  //const filtered = ownedTokens.filter(token => token.metadata?.asset_type === '0xcf8a6a2f3c139c25a8953304402c735703d5039d16b9dac57840c802f3448afc::coin_factory::Emojicoin');
  return <WalletClientPage ownedCoins={ownedTokens.current_coin_balances} />;
}
