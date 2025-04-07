// cspell:word txns

import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { HistoricalEscrow, UserEscrow } from "@/sdk/utils/arena/escrow";
import { findEscrowsInTxn } from "@/sdk/utils/arena/escrow";

type MeleeID = bigint;
type UserAddress = `0x${string}`;
type EscrowMap = Map<MeleeID, UserEscrow | HistoricalEscrow>;

export type EscrowState = {
  addressMap: Map<UserAddress, EscrowMap>;
  alreadyProcessed: Set<bigint>;
};

export type EscrowActions = {
  ensureUserInMap: (user: `0x${string}`) => void;
  /**
   * This function will push new escrows to a user's entry in the map, as long as the new escrow
   * data is later than the existing escrow data for that melee ID.
   */
  pushIfLatest: (user: `0x${string}`, ...escrows: (UserEscrow | HistoricalEscrow)[]) => void;
  processTransactions: (...txns: UserTransactionResponse[]) => void;
};

export type EscrowStore = EscrowActions & EscrowState;

const initialEscrowState = (): EscrowState => ({
  addressMap: new Map(),
  alreadyProcessed: new Set(),
});

export const globalEscrowStore = createStore<EscrowStore>()(
  immer((set, get) => ({
    ...initialEscrowState(),
    ensureUserInMap(user) {
      if (!get().addressMap.has(user)) {
        set((state) => {
          state.addressMap.set(user, new Map());
        });
      }
    },
    processTransactions(...txns) {
      txns
        .filter(({ version }) => !get().alreadyProcessed.has(BigInt(version)))
        .flatMap(findEscrowsInTxn)
        .forEach((escrow) => {
          get().pushIfLatest(escrow.user, escrow);
          set((state) => {
            state.alreadyProcessed.add(escrow.version);
          });
        });
    },
    pushIfLatest(user, ...newEscrows) {
      get().ensureUserInMap(user);
      set((state) => {
        const userEscrows = state.addressMap.get(user)!;
        newEscrows
          .filter((escrow) => user === escrow.user)
          .forEach((escrow) => {
            if (!userEscrows.has(escrow.meleeID)) {
              userEscrows.set(escrow.meleeID, escrow);
            } else {
              const existingEscrow = userEscrows.get(escrow.meleeID)!;
              if (existingEscrow.version < escrow.version) {
                userEscrows.set(escrow.meleeID, escrow);
              }
            }
          });
      });
    },
  }))
);
