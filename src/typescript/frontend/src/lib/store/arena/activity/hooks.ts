import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position-query";
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

export const filterActivityByVersion = (
  results: { version: bigint; delta: bigint }[],
  minimumVersion?: bigint
) => {
  const res =
    minimumVersion !== undefined ? results.filter((v) => v.version > minimumVersion) : results;
  const result = sumByKey(res, "delta", "bigint");
  return result;
};

export const useArenaActivity = () => {
  const user = useAccountAddress();
  const { meleeInfo } = useCurrentMeleeInfo();
  const { position } = useCurrentPositionQuery();

  return useArenaActivityStore((s) => {
    const { meleeID } = meleeInfo ?? {};
    if (!user || meleeID === undefined) return undefined;
    const res = s.addressMap.get(user)?.get(meleeID);
    return res
      ? {
          deposits: filterActivityByVersion(res.deposits, position?.version),
          withdrawals: filterActivityByVersion(res.withdrawals, position?.version),
          matchAmount: filterActivityByVersion(res.matchAmount, position?.version),
          lastExit0: res.lastExit0,
        }
      : {
          deposits: 0n,
          withdrawals: 0n,
          matchAmount: 0n,
          lastExit0: null,
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
