import { type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { toAccountAddressString } from "@sdk/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchOwnerEmojicoinBalances } from "lib/queries/aptos-indexer/fetch-owner-emojicoin-balances";
import { useMemo } from "react";
import { withResponseError } from "./client";
import { getSymbolEmojisInString, symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import { type AssetBalance } from "lib/queries/aptos-indexer/fetch-emojicoin-balances";
import { toNominal } from "lib/utils/decimals";
import { emojisToName } from "lib/utils/emojis-to-name-or-symbol";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { fetchSpecificMarketsAction } from "components/pages/wallet/fetch-specific-markets-action";

const STALE_TIME = 10000;

export type FullCoinData = Omit<AssetBalance, "amount"> &
  Awaited<ReturnType<typeof fetchSpecificMarketsAction>>[number] & {
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

const toFullCoinData = async (ownedTokens: AssetBalance[]) => {
  const markets = await fetchSpecificMarketsAction(
    ownedTokens.map((t) => getSymbolEmojisInString(t.metadata.symbol))
  );
  const ownedSet = new Set(ownedTokens.map((v) => v.metadata.symbol));
  const marketDataMap: Record<string, (typeof markets)[number]> = Object.fromEntries(
    markets
      .map((market) => [market.symbol, market] as [string, (typeof markets)[number]])
      .filter(([symbol]) => ownedSet.has(symbol))
  );

  const coinsWithData: FullCoinData[] = ownedTokens.map((coin) => {
    const marketData = marketDataMap[coin.metadata.symbol];
    const emojiData = symbolBytesToEmojis(coin.metadata.symbol);
    const emojiName = emojisToName(emojiData.emojis);
    const emojiPath = emojiNamesToPath(emojiData.emojis.map((x) => x.name));
    const price = marketData.nominalCurvePrice ?? 0;
    const amount = toNominal(BigInt(coin.amount));
    const ownedValue = amount * price;
    const marketCap = marketData.nominalMarketCap ?? 0;
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
      percentage: 0, // Calculated below.
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

  return {
    ownedCoins: coinsWithData,
    walletStats,
  };
};

/**
 * A hook to continuously fetch the user's emojicoin balances every `refetchInterval` seconds, with
 * a max stale time of `10000`, in case the user leaves the page and comes back.
 *
 * This facilitates a form of rate limiting and caching without needing to store each individual
 * user's cached data server-side.
 *
 * @param owner the user's address
 * @param max the max amount of assets to return
 * @returns the @see FullCoinData[] and wallet stats total value
 */
export const useUserEmojicoinBalances = (owner: AccountAddressInput, max?: number) => {
  const ownerAddress = useMemo(() => toAccountAddressString(owner), [owner]);

  const { data, isLoading } = useQuery({
    queryKey: ["user-emojicoin-balances", ownerAddress, max],
    queryFn: () =>
      withResponseError(fetchOwnerEmojicoinBalances({ ownerAddress, max }).then(toFullCoinData)),
    staleTime: STALE_TIME,
  });

  return {
    ownedCoins: data?.ownedCoins ?? [],
    totalValue: data?.walletStats.totalValue ?? 0,
    isLoading,
  };
};
