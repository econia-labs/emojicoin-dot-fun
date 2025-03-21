import { AccountAddress, type AccountAddressInput } from "@aptos-labs/ts-sdk";
import { sum, toAccountAddressString } from "@sdk/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchOwnerEmojicoinBalances } from "lib/queries/aptos-indexer/fetch-owner-emojicoin-balances";
import { useMemo } from "react";
import { withResponseError } from "./client";
import { getSymbolEmojisInString, toMarketEmojiData } from "@sdk/emoji_data/utils";
import { type AssetBalance } from "lib/queries/aptos-indexer/fetch-emojicoin-balances";
import { toNominal } from "@sdk/utils";
import { emojiNamesToPath } from "utils/pathname-helpers";
import { fetchSpecificMarketsAction } from "components/pages/wallet/fetch-specific-markets-action";

const STALE_TIME = 10000;

export type FullCoinData = Awaited<ReturnType<typeof fetchSpecificMarketsAction>>[number] & {
  symbol: string;
  marketCap: number;
  emojiPath: string;
  amount: number;
  ownedValue: number;
  percentage: number;
};

const toFullCoinData = async (balances: AssetBalance[]) => {
  const ownedSet = new Set(balances.map((v) => v.metadata.symbol));
  const symbols = Array.from(ownedSet).map(getSymbolEmojisInString);
  const markets = await fetchSpecificMarketsAction(symbols);
  const marketDataMap = Object.fromEntries(
    markets
      .map<[string, (typeof markets)[number]]>((market) => [market.symbol, market])
      .filter(([symbol]) => ownedSet.has(symbol))
  );

  const coins = balances.map((coin) => {
    const marketData = marketDataMap[coin.metadata.symbol];
    const names = toMarketEmojiData(coin.metadata.symbol).emojis.map((e) => e.name);
    const emojiPath = emojiNamesToPath(names);
    const amount = toNominal(BigInt(coin.amount));
    const ownedValue = amount * marketData.nominalCurvePrice;
    const marketCap = marketData.nominalMarketCap;
    return {
      ...marketData,
      marketCap,
      symbol: coin.metadata.symbol,
      emojiPath,
      amount,
      ownedValue,
    };
  });

  const totalValue = sum(coins.map((v) => v.ownedValue));
  const ownedCoins = coins.map<FullCoinData>((coin) => ({
    ...coin,
    percentage: (coin.ownedValue / totalValue) * 100,
  }));

  return {
    ownedCoins,
    totalValue,
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
  const ownerAddress = useMemo(
    () => owner && AccountAddress.isValid({ input: owner }).valid && toAccountAddressString(owner),
    [owner]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["user-emojicoin-balances", ownerAddress, max],
    queryFn: () =>
      withResponseError(
        (ownerAddress
          ? fetchOwnerEmojicoinBalances({ ownerAddress, max })
          : Promise.resolve([])
        ).then(toFullCoinData)
      ),
    staleTime: STALE_TIME,
    enabled: !!owner && AccountAddress.isValid({ input: owner }).valid,
  });

  return {
    ownedCoins: data?.ownedCoins ?? [],
    totalValue: data?.totalValue ?? 0,
    isLoading,
  };
};
