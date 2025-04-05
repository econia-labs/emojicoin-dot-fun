import { useFetchWalletBalanceQuery } from "lib/hooks/queries/use-wallet-balance";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";

import type { TypeTagInput } from "@/sdk/index";
import type { CoinTypeString } from "@/sdk/utils";
import { toCoinTypeString } from "@/sdk/utils";

import { globalUserTransactionStore } from "../transaction/store";
import type { LatestBalanceStore } from "./store";
import { globalLatestBalanceStore } from "./store";

export const useLatestBalance = (
  accountAddress: `0x${string}` | undefined,
  coinTypeIn: TypeTagInput | undefined
) => {
  const coinType = useMemo(
    () => (coinTypeIn && toCoinTypeString(coinTypeIn)) || undefined,
    [coinTypeIn]
  );

  useSyncBalanceFromTransactionStore(accountAddress, coinType);
  const queryRes = useFetchWalletBalanceQuery(accountAddress, coinType);

  const balance = useLatestBalanceStore(
    (s) => accountAddress && coinType && s.addressMap.get(accountAddress)?.get(coinType)?.balance
  );

  useEffect(() => {
    if (accountAddress && coinType) {
      globalLatestBalanceStore.getState().maybeUpdate(accountAddress, coinType, {
        balance: queryRes.balance,
        version: queryRes.version,
      });
    }
  }, [accountAddress, coinType, queryRes.balance, queryRes.version]);

  return {
    balance: balance ?? 0n,
    isFetching: queryRes.isFetching,
    refetchBalance: queryRes.refetchBalance,
  };
};

/**
 * In order to process all incoming transactions, we need to subscribe to all incoming transactions
 * from the global txn store and process the balances accordingly.
 * The `useRef` + `.subscribe` pattern here is the recommended way of subscribing to a store with a
 * selector in a reactive way.
 *
 * @param coinType the coin type to track. A parsed and standardized, fully-qualified type string
 * @param address the account address to store changes for
 *
 * @see {@link https://github.com/pmndrs/zustand/tree/main?tab=readme-ov-file#transient-updates-for-often-occurring-state-changes}
 */
function useSyncBalanceFromTransactionStore(
  address: `0x${string}` | undefined,
  coinType: CoinTypeString | undefined
) {
  const transactionsRef = useRef(
    address && globalUserTransactionStore.getState().addresses.get(address)
  );

  useEffect(
    () =>
      globalUserTransactionStore.subscribe(
        (state) => (transactionsRef.current = address && state.addresses.get(address)),
        (newTransactions, _prevTransactions) => {
          if (address && coinType && newTransactions) {
            globalLatestBalanceStore
              .getState()
              .processChanges(address, coinType, ...newTransactions);
          }
        }
      ),
    [address, coinType]
  );
}

function useLatestBalanceStore<T>(selector: (store: LatestBalanceStore) => T): T {
  return useStore(globalLatestBalanceStore, selector);
}
