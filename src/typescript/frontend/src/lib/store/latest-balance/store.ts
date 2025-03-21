import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useFetchWalletBalanceQuery } from "lib/hooks/queries/use-wallet-balance";
import { useEffect, useMemo, useRef } from "react";
import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { TypeTagInput } from "@/sdk/emojicoin_dot_fun/types";
import {
  getCoinBalanceFromChanges,
  toCoinTypeString,
} from "@/sdk/utils/parse-changes-for-balances";
import type { CoinTypeString } from "@/sdk/utils/type-tags";

import { globalTransactionStore } from "../transaction/store";

type LatestBalance = {
  balance: bigint;
  version: bigint;
};

type CoinBalanceMap = Map<CoinTypeString, LatestBalance>;
type AddressToCoinMap = Map<`0x${string}`, CoinBalanceMap>;

type LatestBalanceStore = {
  ensureInStore: (addr: `0x${string}`, coinType: CoinTypeString) => void;
  maybeUpdate: (addr: `0x${string}`, coinType: CoinTypeString, incoming: LatestBalance) => void;
  processChanges: (
    addr: `0x${string}`,
    coinType: CoinTypeString,
    ...transactions: UserTransactionResponse[]
  ) => void;
  addressMap: AddressToCoinMap;
};

// The global store for all latest balances. This is the actual zustand/immer store.
const globalLatestBalanceStore = createStore<LatestBalanceStore>()(
  immer((set, get) => ({
    addressMap: new Map(),
    ensureInStore(addr, coinType) {
      const addrMap = get().addressMap.get(addr);
      const coinMap = get().addressMap.get(addr)?.get(coinType);
      if (!addrMap) {
        set((state) => {
          state.addressMap.set(addr, new Map());
        });
      }
      if (!coinMap) {
        set((state) => {
          state.addressMap.get(addr)!.set(coinType, {
            balance: 0n,
            version: -1n,
          });
        });
      }
    },
    maybeUpdate(addr, coinType, incoming) {
      get().ensureInStore(addr, coinType);
      const currVersion = get().addressMap.get(addr)!.get(coinType)!.version;

      if (incoming.version <= currVersion) return;

      set((state) => {
        state.addressMap.get(addr)!.set(coinType, incoming);
      });
    },
    processChanges(addr, coinType, ...transactions) {
      get().ensureInStore(addr, coinType);
      set((state) => {
        const map = state.addressMap.get(addr)!;

        for (const txn of transactions) {
          const newVersion = BigInt(txn.version);
          const currVersion = map.get(coinType)!.version;

          if (newVersion <= currVersion) continue;

          const newBalance = getCoinBalanceFromChanges({
            response: txn,
            userAddress: addr,
            coinType,
          });

          if (typeof newBalance === "bigint") {
            map.set(coinType, {
              balance: newBalance,
              version: newVersion,
            });
          }
        }
      });
    },
  }))
);

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
const useSyncBalanceFromTransactionStore = (
  address: `0x${string}` | undefined,
  coinType: CoinTypeString | undefined
) => {
  const transactionsRef = useRef(
    address && globalTransactionStore.getState().addresses.get(address)
  );

  useEffect(
    () =>
      globalTransactionStore.subscribe(
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
};

export const useLatestBalanceStore = <T>(selector: (store: LatestBalanceStore) => T): T =>
  useStore(globalLatestBalanceStore, selector);

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
    refetchIfStale: queryRes.refetchIfStale,
  };
};
