import { fetchMarkets } from "@/queries/home";
import { symbolBytesToEmojis, type SymbolEmoji } from "@sdk/emoji_data";
import { getMarketAddress } from "@sdk/emojicoin_dot_fun";
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
  const [ownedTokens, aptPrice] = await Promise.all([
    fetchAllFungibleAssetsBalance({ ownerAddress: params.address }),
    getAptPrice(),
  ]);

  console.log(ownedTokens);
  // Convert emojis to market address to query from the indexer.
  // Querying with the emoji directly causes issues for composite emojis such as 🇺🇸 which is a combination of 🇺 and 🇸.
  const marketAddresses = ownedTokens.flatMap((coin) =>
    getMarketAddress([...coin.metadata.symbol] as SymbolEmoji[]).toString()
  );

  // Split addresses into chunks to avoid URL length limits.
  const chunkSize = 50;
  const chunks = Array.from({ length: Math.ceil(marketAddresses.length / chunkSize) }, (_, i) =>
    marketAddresses.slice(i * chunkSize, (i + 1) * chunkSize)
  );

  // Fetch market data in parallel for each chunk.
  const marketDataMap: Record<string, Awaited<ReturnType<typeof fetchMarkets>>[number]> = (
    await Promise.all(chunks.map((chunk) => fetchMarkets({ filterMarketAddresses: chunk })))
  )
    .flat() // Flatten the array of arrays.
    .reduce((acc, market) => {
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
