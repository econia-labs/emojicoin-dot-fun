import { useEffect, useRef } from "react";
import { useStore } from "zustand";

import { useAccountAddress } from "@/hooks/use-account-address";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { getEvents, sumByKey } from "@/sdk/index";
import {
  diffFromEnter,
  diffFromExit,
  diffFromSwap,
} from "@/sdk/indexer-v2/mini-processor/arena/position-diff";
import { globalUserTransactionStore } from "@/store/transaction/store";

import { type ArenaActivityStore, globalArenaActivityStore } from "./store";

const maybeFiltered = (results: { version: bigint; delta: bigint }[], minimumVersion?: bigint) => {
  const res =
    minimumVersion !== undefined ? results.filter((v) => v.version > minimumVersion) : results;
  const result = sumByKey(res, "delta", "bigint");
  return result;
};

export const useArenaActivity = (latestPositionVersion?: bigint) => {
  const user = useAccountAddress();
  const { meleeInfo } = useCurrentMeleeInfo();

  return useArenaActivityStore((s) => {
    if (!user || !meleeInfo) return undefined;
    const res = s.addressMap.get(user)?.get(meleeInfo?.meleeID);
    if (!res) return undefined;
    return {
      deposits: maybeFiltered(res.deposits, latestPositionVersion),
      withdrawals: maybeFiltered(res.withdrawals, latestPositionVersion),
      matchAmount: maybeFiltered(res.matchAmount, latestPositionVersion),
      lastExit0: res.lastExit0,
    };
  });
};

export function useArenaActivityStore<T>(selector: (store: ArenaActivityStore) => T): T {
  return useStore(globalArenaActivityStore, selector);
}

/**
 * See `useSyncBalanceFromTransactionStore` for a similar implementation and explanation.
 * This essentially processes incoming transactions for the currently connected user, specifically
 * for arena activity.
 */
export function useSyncArenaActivity() {
  const address = useAccountAddress();
  const transactionsRef = useRef(
    address && globalUserTransactionStore.getState().addresses.get(address)
  );

  useEffect(
    () =>
      globalUserTransactionStore.subscribe(
        (state) => (transactionsRef.current = address && state.addresses.get(address)),
        (newTransactions, _prevTransactions) => {
          if (address && newTransactions) {
            for (const txn of newTransactions) {
              const events = getEvents(txn);
              const { updateWithDiffModel } = globalArenaActivityStore.getState();
              events.arenaEnterEvents.map(diffFromEnter).forEach(updateWithDiffModel);
              // Swaps occur before exits in the event indices when they both occur in a single
              // transaction. Process them accordingly.
              events.arenaSwapEvents.map(diffFromSwap).forEach(updateWithDiffModel);
              events.arenaExitEvents.map(diffFromExit).forEach(updateWithDiffModel);
            }
          }
        }
      ),
    [address]
  );
}
