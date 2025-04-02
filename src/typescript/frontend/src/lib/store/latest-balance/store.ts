import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import { getCoinBalanceFromChanges } from "@/sdk/utils/parse-changes-for-balances";
import type { CoinTypeString } from "@/sdk/utils/type-tags";

type LatestBalance = {
  balance: bigint;
  version: bigint;
};

type CoinBalanceMap = Map<CoinTypeString, LatestBalance>;
type AddressToCoinMap = Map<`0x${string}`, CoinBalanceMap>;

export type LatestBalanceStore = {
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
export const globalLatestBalanceStore = createStore<LatestBalanceStore>()(
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
