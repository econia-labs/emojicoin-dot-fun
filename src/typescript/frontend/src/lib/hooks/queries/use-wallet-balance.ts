import { type Aptos } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { withResponseError } from "./client";
import { useCallback, useMemo, useRef, useState } from "react";
import { type TypeTagInput } from "@sdk/emojicoin_dot_fun";
import { Balance } from "@/contract-apis";
import { type AccountInfo } from "@aptos-labs/wallet-adapter-core";

/**
 * __NOTE: If you're using this for a connected user's APT balance, you should use__
 * `aptBalance, setBalance, refetchBalance` in the `AptosContextProvider` instead of this hook,
 * because it will have persistent state across the whole application.
 *
 * A hook to get the user's account balance for a coin type. Defaults to APT if no type is provided.
 *
 * @param aptos The aptos client
 * @param accountAddress The account address for which to get the balance
 * @param coinTypeTag The coin type for which to get the balance
 * @param staleTime The time in milliseconds before the cache is considered stale
 * @param refetchInterval The time in milliseconds to refetch the balance
 * @returns {number} balance The balance of the account
 * @returns {boolean} isFetching Whether the query is fetching
 * @returns {(num: number) => void} setBalance A function to manually set the balance
 * @returns {() => void} forceRefetch A function to force refetch the balance
 * @returns {() => void} refetchIfStale A function to refetch the balance only if it is stale
 */
export const useWalletBalance = ({
  aptos,
  account,
  coinType,
  staleTime = 10000,
  refetchInterval,
}: {
  aptos: Aptos;
  account: AccountInfo | null;
  coinType?: TypeTagInput;
  staleTime?: number;
  refetchInterval?: number;
}) => {
  const accountAddress = account?.address;
  // We use a nonce here because invalidateQuery for some reason does not work.
  const [nonce, setNonce] = useState(0);
  const manualBalance = useRef<bigint | null>(null);
  const queryKey = useMemo(() => {
    return ["getAccountCoinAmount", aptos.config.network, accountAddress, coinType, nonce];
  }, [aptos.config.network, accountAddress, coinType, nonce]);

  // refetch if isStale technically calls the query twice, so we could optimize this with
  // a ref, but it's not a big deal because the graphQL endpoint should be able to handle it.
  const {
    data: balance,
    isFetching,
    refetch,
    isStale,
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (!accountAddress || !coinType) return 0;
      if (manualBalance.current !== null) {
        const res = manualBalance.current;
        // Only use the manual balance once.
        manualBalance.current = null;
        return res;
      }
      return withResponseError(
        Balance.view({
          aptos,
          owner: accountAddress,
          typeTags: [coinType],
        }).then((res) => BigInt(res))
      );
    },
    placeholderData: (previousBalance) => previousBalance ?? 0,
    staleTime,
    refetchInterval,
  });

  const setBalance = useCallback((num: bigint) => {
    manualBalance.current = num;
    setNonce((n) => n + 1);
  }, []);

  const refetchIfStale = useCallback(() => {
    if (isStale) {
      refetch();
    }
  }, [refetch, isStale]);

  return {
    balance: BigInt(balance ?? 0),
    isFetching,
    setBalance,
    forceRefetch: refetch,
    refetchIfStale,
  };
};
