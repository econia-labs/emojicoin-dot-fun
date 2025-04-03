import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { createStore, useStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { compareBigInt, toAccountAddressString } from "@/sdk/utils";

type Actions = {
  ensureInStore: (uniqueAddresses: Set<`0x${string}`>) => void;
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
        const missingUniques = uniqueAddresses
          .keys()
          .filter((addr) => !get().addresses.get(addr))
          .toArray();

        if (!missingUniques.length) return;

        set((state) => {
          missingUniques.forEach((addr) => {
            state.addresses.set(addr, []);
          });
        });
      },
      pushTransactions: (...transactions) => {
        const addresses = transactions.map(({ sender }) => toAccountAddressString(sender));
        const uniqueAddresses = new Set(addresses);
        if (!uniqueAddresses.size) return;

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
