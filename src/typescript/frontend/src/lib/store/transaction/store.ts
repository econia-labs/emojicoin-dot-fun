import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { compareBigInt, toAccountAddressString } from "@/sdk/utils";

type Actions = {
  ensureInStore: (uniqueAddresses: `0x${string}`[]) => void;
  pushTransactions: (...transactions: UserTransactionResponse[]) => void;
};

type State = {
  addresses: Readonly<Map<`0x${string}`, Readonly<UserTransactionResponse[]>>>;
  latestResponse?: UserTransactionResponse;
};

export type UserTransactionStore = Actions & State;

export const globalUserTransactionStore = createStore<UserTransactionStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ensureInStore: (uniqueAddresses) => {
        const missingUniquesSet = new Set(uniqueAddresses).keys();

        const missingUniques = Array.from(missingUniquesSet).filter(
          (addr) => !get().addresses.get(addr)
        );

        if (!missingUniques.length) return;

        set((state) => {
          missingUniques.forEach((addr) => {
            state.addresses.set(addr, []);
          });
        });
      },
      pushTransactions: (...transactions) => {
        const uniqueAddresses = Array.from(
          new Set(transactions.map(({ sender }) => toAccountAddressString(sender)))
        );
        if (!uniqueAddresses.length) return;

        get().ensureInStore(uniqueAddresses);

        set((state) => {
          state.latestResponse = transactions
            .toSorted(({ version: a }, { version: b }) => compareBigInt(a, b))
            .at(-1)!;

          uniqueAddresses.forEach((addr) => {
            state.addresses
              .get(addr)!
              .push(...transactions.filter(({ sender }) => sender === addr));
          });
        });
      },
      addresses: new Map(),
      latestResponse: undefined,
    }))
  )
);

export function useUserTransactionStore<T>(selector: (store: UserTransactionStore) => T): T {
  return useStore(globalUserTransactionStore, selector);
}
