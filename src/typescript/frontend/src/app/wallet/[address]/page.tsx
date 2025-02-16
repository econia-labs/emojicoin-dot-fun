import { fetchMarkets } from "@/queries/home";
import { symbolBytesToEmojis, type SymbolEmoji } from "@sdk/emoji_data";
import { getMarketAddress } from "@sdk/emojicoin_dot_fun";
import { toNominalPrice } from "@sdk/utils";
import { WalletClientPage } from "components/pages/wallet/WalletClientPage";
import { fetchAllTokens, type TokenData } from "lib/aptos-indexer/fungible-assets";
import { toNominal } from "lib/utils/decimals";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { type Metadata } from "next";
import { emojiNamesToPath } from "utils/pathname-helpers";

export const metadata: Metadata = {
  title: "Explore the cult",
  description: `Explore the emojicoin cult`,
};

export type FullCoinData = Omit<TokenData, "amount"> &
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

export default async function WalletPage({ params }: { params: { address: string } }) {
  const ownedTokens = await fetchAllTokens(params.address);

  // Convert emojis to market address to query from the indexer.
  // Querying with the emoji directly causes issues for composite emojis such as 🇺🇸 which is a combination of 🇺 and 🇸.
  const marketAddresses = ownedTokens.flatMap((coin) =>
    getMarketAddress([...coin.metadata.symbol] as SymbolEmoji[]).toString()
  );

  // Fetch market data and create map for O(1) lookup.
  const marketDataMap: Record<string, Awaited<ReturnType<typeof fetchMarkets>>[number]> = (
    await fetchMarkets({ filterMarketAddresses: marketAddresses })
  ).reduce((acc, market) => {
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
      <WalletClientPage
        address={params.address}
        ownedCoins={coinsWithData}
        walletStats={walletStats}
      />
    </div>
  );
}
