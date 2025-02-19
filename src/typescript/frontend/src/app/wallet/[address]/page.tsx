import { getSymbolEmojisInString, symbolBytesToEmojis } from "@sdk/emoji_data";
import { fetchSpecificMarkets } from "@sdk/indexer-v2/queries";
import { toNominalPrice } from "@sdk/utils";
import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { AptPriceContextProvider } from "context/AptPrice";
import {
  fetchAllFungibleAssetsBalance,
  type TokenBalance,
} from "lib/aptos-indexer/fungible-assets";
import { getAptPrice } from "lib/queries/get-apt-price";
import { toNominal } from "lib/utils/decimals";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { type Metadata } from "next";
import { emojiNamesToPath } from "utils/pathname-helpers";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export type FullCoinData = Omit<TokenBalance, "amount"> &
  Awaited<ReturnType<typeof fetchSpecificMarkets>>[number] & {
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

export default async function WalletPage({ params }: { params: { address: string } }) {
  const [ownedTokens, aptPrice] = await Promise.all([
    fetchAllFungibleAssetsBalance({ ownerAddress: params.address }),
    getAptPrice(),
  ]);
  const markets = await fetchSpecificMarkets(
    ownedTokens.map((t) => getSymbolEmojisInString(t.metadata.symbol))
  );
  const marketDataMap: Record<string, (typeof markets)[number]> = markets.reduce((acc, market) => {
    acc[market.market.symbolData.symbol] = market;
    return acc;
  }, {});

  const coinsWithData = ownedTokens.map((coin) => {
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
    <div className="mx-auto">
      <AptPriceContextProvider aptPrice={aptPrice}>
        <WalletClientPage
          address={params.address}
          ownedCoins={coinsWithData}
          walletStats={walletStats}
        />
      </AptPriceContextProvider>
    </div>
  );
}
