import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { createStore } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { toAccountAddressString } from "@/sdk/utils";

type Actions = {
  ensureInStore: (uniqueAddresses: Set<`0x${string}`>) => void;
  pushTransactions: (...transactions: UserTransactionResponse[]) => void;
};

type State = {
  addresses: Readonly<Map<`0x${string}`, Readonly<UserTransactionResponse[]>>>;
};

export type TransactionStore = Actions & State;

export const globalTransactionStore = createStore<TransactionStore>()(
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
          uniqueAddresses.forEach((addr) => {
            state.addresses.get(addr)!.push(...transactions);
          });
        });
      },
      addresses: new Map(),
    }))
  )
);
