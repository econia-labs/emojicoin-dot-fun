import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { Option } from "@sdk/utils";
import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";

type Actions = {
  insert: (addr: `0x${string}`) => void;
  push: (addr: `0x${string}`, ...transactions: UserTransactionResponse[]) => void;
};

type State = {
  accounts: Readonly<Map<`0x${string}`, Readonly<UserTransactionResponse[]>>>;
};

export type TransactionStore = Actions & State;

export const globalTransactionStore = createStore<TransactionStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      insert: (user: `0x${string}`) => {
        if (!get().accounts.get(user)) {
          set((state) => {
            state.accounts.set(user, []);
          });
        }
      },
      push: (user: `0x${string}`, ...transactions: UserTransactionResponse[]) => {
        get().insert(user);
        set((state) => {
          const account = state.accounts.get(user);
          Option(account)
            .unwrap()
            .push(...transactions);
        });
      },
      accounts: new Map(),
    }))
  )
);
