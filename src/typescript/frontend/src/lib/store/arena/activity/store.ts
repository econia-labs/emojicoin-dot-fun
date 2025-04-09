import { createStore } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { PositionDiff } from "@/sdk/indexer-v2/mini-processor/arena/position-diff";

export type Activity = { version: bigint; delta: bigint }[];

type UserAddress = `0x${string}`;
type AllActivity = {
  deposits: Activity;
  withdrawals: Activity;
  matchAmount: Activity;
  lastExit0: boolean | null;
};
type ActivityMap = Map<bigint, AllActivity>;

type State = {
  addressMap: Map<UserAddress, ActivityMap>;
  alreadyProcessed: Set<bigint>;
};

type Actions = {
  ensureUserInMap: (user: `0x${string}`, meleeID: bigint) => void;
  updateWithDiffModel: (diff: PositionDiff) => void;
};

export type ArenaActivityStore = State & Actions;

/**
 * Track the user's in-app activity in a store so it's possible to track trading activity and new
 * statistics without having to refetch from the indexer.
 */
export const globalArenaActivityStore = createStore<ArenaActivityStore>()(
  immer((set, get) => ({
    addressMap: new Map(),
    alreadyProcessed: new Set(),
    ensureUserInMap(user: `0x${string}`, meleeID: bigint) {
      // If the user does not exist in the mapping, initialize them and initialize their activity.
      if (!get().addressMap.has(user)) {
        set((state) => {
          state.addressMap.set(user, new Map());
          state.addressMap.get(user)!.set(meleeID, {
            deposits: [],
            withdrawals: [],
            matchAmount: [],
            lastExit0: null,
          });
        });
      } else {
        // If the user exists but not with a meleeID mapping, initialize one.
        if (!get().addressMap.get(user)!.has(meleeID)) {
          set((state) => {
            state.addressMap.get(user)!.set(meleeID, {
              deposits: [],
              withdrawals: [],
              matchAmount: [],
              lastExit0: null,
            });
          });
        }
      }
    },
    updateWithDiffModel({ user, meleeID, deposits, withdrawals, matchAmount, version, lastExit0 }) {
      if (get().alreadyProcessed.has(version)) return;
      get().ensureUserInMap(user, meleeID);
      set((state) => {
        const userActivity = state.addressMap.get(user)!;
        const meleeActivity = userActivity.get(meleeID)!;
        meleeActivity.deposits.push({ version, delta: deposits });
        meleeActivity.withdrawals.push({ version, delta: withdrawals });
        meleeActivity.matchAmount.push({ version, delta: matchAmount });
        meleeActivity.lastExit0 = lastExit0;
        state.alreadyProcessed.add(version);
      });
    },
  }))
);
