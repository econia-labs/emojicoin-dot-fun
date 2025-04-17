import { useEventStore } from "context/event-store-context/hooks";
import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import type { coalescePositionAndEscrow } from "lib/hooks/positions/utils";
import { useMemo } from "react";
import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { WalletInputTransactionData } from "@/sdk/emojicoin_dot_fun/payload-builders";
import type { ArenaInfoModel } from "@/sdk/index";
import type { SubmittableArenaFunctions } from "@/sdk/types/arena-types";
import { toSubmittedArenaFunctionName } from "@/sdk/types/arena-types";

type SnapshotData = {
  meleeInfo: ArenaInfoModel;
  position: ReturnType<typeof coalescePositionAndEscrow>;
};

type ArenaPhaseState = {
  phase: "pick" | "amount" | "lock" | "summary";
  selectedMarket: 0 | 1 | undefined;
  amount: bigint | undefined;
  error: boolean;
  snapshot:
    | ({
        functionName: SubmittableArenaFunctions;
      } & SnapshotData)
    | undefined;
};

type ArenaPhaseActions = {
  setPhase: (phase: "pick" | "amount" | "lock" | "summary") => void;
  setMarket: (selectionOrEscrow: 0 | 1 | CurrentUserPosition, reversed?: "reversed") => void;
  setAmount: (amount: bigint) => void;
  setError: (error: boolean) => void;
  setSubmitSnapshot: (
    snapshotData: SnapshotData | undefined | null,
    transactionBuilder: WalletInputTransactionData | undefined | null
  ) => void;
};

type ArenaPhaseStore = ArenaPhaseState & ArenaPhaseActions;

const initialArenaPhaseState = (): ArenaPhaseState => ({
  phase: "pick",
  selectedMarket: undefined,
  amount: undefined,
  error: false,
  snapshot: undefined,
});

export const globalArenaPhaseStore = createStore<ArenaPhaseStore>()(
  immer((set) => ({
    ...initialArenaPhaseState(),
    setPhase(phase) {
      set((state) => {
        state.phase = phase;
      });
    },
    setSubmitSnapshot(snapshotData, transactionBuilder) {
      if (!snapshotData || !transactionBuilder) return;
      const { function: functionNameRaw } = transactionBuilder.data;
      const functionName = toSubmittedArenaFunctionName(functionNameRaw);
      if (!functionName) return;
      set((state) => {
        state.snapshot = {
          functionName,
          ...snapshotData,
        };
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
            state.selectedMarket = selectionOrEscrow.emojicoin0Balance > 0n ? 0 : 1;
          } else {
            state.selectedMarket = selectionOrEscrow.emojicoin0Balance > 0n ? 1 : 0;
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

export function useSelectedMarket() {
  const selection = useArenaPhaseStore((s) => s.selectedMarket);
  const info = useEventStore((s) => s.arenaInfoFromServer);
  const market0 = useEventStore((s) => s.getMarketLatestState(info?.emojicoin0Symbols));
  const market1 = useEventStore((s) => s.getMarketLatestState(info?.emojicoin1Symbols));

  return useMemo(
    () => (selection === 0 ? market0 : selection === 1 ? market1 : undefined),
    [market0, market1, selection]
  );
}
