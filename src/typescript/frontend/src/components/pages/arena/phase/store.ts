import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { UserEscrow } from "@/sdk/index";

type ArenaPhaseState = {
  phase?: "pick" | "amount" | "lock" | "summary" | undefined;
  selectedMarket: 0 | 1 | undefined;
  amount: bigint | undefined;
  error: boolean;
};

type ArenaPhaseActions = {
  setPhase: (phase: "pick" | "amount" | "lock" | "summary") => void;
  setMarket: (selectionOrEscrow: 0 | 1 | UserEscrow, reversed?: "reversed") => void;
  setAmount: (amount: bigint) => void;
  setError: (error: boolean) => void;
};

type ArenaPhaseStore = ArenaPhaseState & ArenaPhaseActions;

const initialArenaPhaseState = (): ArenaPhaseState => ({
  phase: undefined,
  selectedMarket: undefined,
  amount: undefined,
  error: false,
});

const globalArenaPhaseStore = createStore<ArenaPhaseStore>()(
  immer((set) => ({
    ...initialArenaPhaseState(),
    setPhase(phase) {
      set((state) => {
        state.phase = phase;
      });
    },
    setMarket(selectionOrEscrow, reversed) {
      set((state) => {
        if (typeof selectionOrEscrow === "number") {
          if (reversed) {
            throw new Error('Don\'t pass "reversed" with a number selection');
          }
          state.selectedMarket = selectionOrEscrow;
        } else {
          if (!reversed) {
            state.selectedMarket = selectionOrEscrow.emojicoin0 > 0n ? 0 : 1;
          } else {
            state.selectedMarket = selectionOrEscrow.emojicoin0 > 0n ? 1 : 0;
          }
        }
      });
    },
    setAmount(amount) {
      set((state) => {
        state.amount = amount;
      });
    },
    setError(error) {
      set((state) => {
        state.error = error;
      });
    },
  }))
);

export function useArenaPhaseStore<T>(selector: (store: ArenaPhaseStore) => T): T {
  return useStore(globalArenaPhaseStore, selector);
}
