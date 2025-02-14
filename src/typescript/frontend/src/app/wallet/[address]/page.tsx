import { fetchMarkets } from "@/queries/home";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { getAptosClient, toNominalPrice } from "@sdk/utils";
import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { toNominal } from "lib/utils/decimals";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { type Metadata } from "next";
import { emojiNamesToPath } from "utils/pathname-helpers";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export type CoinData = {
  amount: string;
  asset_type: string;
  metadata: {
    symbol: string;
    decimals: number;
  };
};

export type FullCoinData = Omit<CoinData, "amount"> &
  Awaited<ReturnType<typeof fetchMarkets>>[number] & {
    symbol: string;
    marketCap: number;
    emojiData: ReturnType<typeof symbolBytesToEmojis>;
    emojiName: string;
    emojiPath: string;
    amount: number;
    price: number;
    ownedValue: number;
    percentage?: number;
  };

export type FetchEmojicoinBalancesResponse = {
  current_fungible_asset_balances: CoinData[];
};

const aptosClient = getAptosClient();

export default async function WalletPage({ params }: { params: { address: string } }) {
  const ownedTokens: FetchEmojicoinBalancesResponse = await aptosClient.queryIndexer({
    query: {
      query: `query CoinsData($address: String) {
                current_fungible_asset_balances(
                  where: {owner_address: {_eq: $address}, metadata: {token_standard: {_eq: "v1"}}, amount: {_gt: "0"}, asset_type: {_ilike: "%coin_factory::Emojicoin%"}}
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
      variables: { address: params.address },
    },
  });

  // Fetch market data and create map for O(1) lookup.
  const marketDataMap: Record<string, Awaited<ReturnType<typeof fetchMarkets>>[number]> = (
    await fetchMarkets({
      filterEmojis: ownedTokens.current_fungible_asset_balances.map((coin) => [
        ...coin.metadata.symbol,
      ]),
    })
  ).reduce((acc, market) => {
    acc[market.market.symbolData.symbol] = market;
    return acc;
  }, {});

  const coinsWithData = ownedTokens.current_fungible_asset_balances.map((coin) => {
    const marketData = marketDataMap[coin.metadata.symbol];
    const emojiData = symbolBytesToEmojis(coin.metadata.symbol);
    const emojiName = emojisToName(emojiData.emojis);
    const emojiPath = emojiNamesToPath(emojiData.emojis.map((x) => x.name));
    const price = marketData ? toNominalPrice(marketData.lastSwap.avgExecutionPriceQ64) : 0;
    const amount = toNominal(BigInt(coin.amount));
    const ownedValue = amount * price;
    const marketCap = marketData ? toNominal(marketData.state.instantaneousStats.marketCap) : 0;
    return {
      ...coin,
      ...marketData,
      marketCap,
      emojiName,
      symbol: coin.metadata.symbol,
      emojiData,
      emojiPath,
      amount,
      price,
      ownedValue,
      // Will be calculated later.
      percentage: 0,
    };
  });

  const walletStats = coinsWithData.reduce(
    (acc, coin) => {
      acc.totalValue += coin.ownedValue;
      return acc;
    },
    { totalValue: 0 }
  );

  coinsWithData.forEach((coin) => {
    coin.percentage = (coin.ownedValue / walletStats.totalValue) * 100;
  });

  return (
    <div className="max-w-[1000px] mx-auto">
      <WalletClientPage
        address={params.address}
        ownedCoins={coinsWithData}
        walletStats={walletStats}
      />
    </div>
  );
}
