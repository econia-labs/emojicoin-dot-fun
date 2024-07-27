import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type TypeTagInput } from "@sdk/emojicoin_dot_fun";
import {
  AccountAddress,
  parseTypeTag,
  type AccountAddressInput,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { getNewCoinBalanceFromChanges } from "utils/parse-changes-for-balances";
import { APTOS_COIN_TYPE_TAG } from "@sdk/const";

type TypeTagString = string;

/**
 * This state store only manages the coin balances for an account.
 * Updating the balance when the user account changes in the wallet adapter is up to the
 * context provider for that. This merely manages state updates for the balances in a way
 * that is easy to access and update.
 */

export type CoinBalanceState = {
  emojicoin?: Readonly<TypeTagString>;
  emojicoinLP?: Readonly<TypeTagString>;
  balances: Readonly<{
    apt: Readonly<bigint>;
    emojicoin?: Readonly<bigint>;
    emojicoinLP?: Readonly<bigint>;
  }>;
};

export type CoinBalanceActions = {
  setEmojicoin: (typeTag: TypeTagInput) => void;
  setEmojicoinLP: (typeTag: TypeTagInput) => void;
  setAptBalance: (balance: bigint) => void;
  setEmojicoinBalance: (balance: bigint) => void;
  setEmojicoinLPBalance: (balance: bigint) => void;
  updateBalancesFromWritesetChanges: (
    response: UserTransactionResponse,
    user: AccountAddressInput
  ) => void;
};

const createInitialCoinBalanceStore: () => CoinBalanceState = () => ({
  emojicoin: undefined,
  emojicoinLP: undefined,
  balances: {
    apt: 0n,
    emojicoin: 0n,
    emojicoinLP: 0n,
  },
});

export type CoinBalanceStore = CoinBalanceState & CoinBalanceActions;

export const createCoinBalanceStore = (initial?: CoinBalanceStore) => {
  return createStore<CoinBalanceStore>()(
    immer((set) => ({
      ...(initial ?? createInitialCoinBalanceStore()),
      setEmojicoin: (typeTag) => set((state) => (state.emojicoin = typeTag.toString())),
      setEmojicoinLP: (typeTag) => set((state) => (state.emojicoinLP = typeTag.toString())),
      setAptBalance: (balance) => set((state) => (state.balances.apt = balance)),
      setEmojicoinBalance: (balance) => set((state) => (state.balances.emojicoin = balance)),
      setEmojicoinLPBalance: (balance) => set((state) => (state.balances.emojicoinLP = balance)),
      updateBalancesFromWritesetChanges: (response, user) =>
        set((state) => {
          const changes = response.changes;
          state.balances.apt = getNewCoinBalanceFromChanges({
            changes,
            userAddress: AccountAddress.from(user),
            coinType: APTOS_COIN_TYPE_TAG,
          });
          if (state.emojicoin) {
            state.balances.emojicoin = getNewCoinBalanceFromChanges({
              changes,
              userAddress: AccountAddress.from(user),
              coinType: parseTypeTag(state.emojicoin),
            });
          }
          if (state.emojicoinLP) {
            state.balances.emojicoinLP = getNewCoinBalanceFromChanges({
              changes,
              userAddress: AccountAddress.from(user),
              coinType: parseTypeTag(state.emojicoinLP),
            });
          }
        }),
    }))
  );
};
