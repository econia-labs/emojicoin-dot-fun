import { useHistoricalPositionsQuery } from "lib/hooks/queries/arena/use-historical-positions-query";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";

import { useAccountAddress } from "@/hooks/use-account-address";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { isUserEscrow, positionToUserEscrow } from "@/sdk/utils";

import { globalUserTransactionStore } from "../../transaction/store";
import type { EscrowStore } from "./store";
import { globalEscrowStore } from "./store";

/**
 * Set up the zustand store and react query hooks for the current user. If this hook is being
 * rendered, it means it is actively listening to incoming transactions to know if it needs to
 * fetch new data and update the latest escrow in the global store.
 *
 * Use this hook to fetch position data and sync it with app data.
 * Use {@link useArenaEscrowStore} in individual components to get the latest escrow data.
 */
export const useSyncArenaEscrows = () => {
  const accountAddress = useAccountAddress();

  // Escrows from transaction submission data.
  useSyncEscrowsFromTransactionStore(accountAddress);

  // Escrows from position query data.
  const escrowsFromPositions = useEscrowsFromPositions();

  // Update the arena escrow store with whichever state is more recent between the query data
  // and the global transaction store.
  useEffect(() => {
    if (accountAddress && escrowsFromPositions) {
      globalEscrowStore.getState().pushIfLatest(accountAddress, ...escrowsFromPositions);
    }
  }, [accountAddress, escrowsFromPositions]);
};

function useEscrowsFromPositions() {
  const { history } = useHistoricalPositionsQuery();

  return useMemo(() => {
    return history.map(positionToUserEscrow);
  }, [history]);
}

/**
 * See `useSyncBalanceFromTransactionStore` for a similar implementation and explanation.
 * This essentially processes incoming transactions for the currently connected user, specifically
 * for the arena escrow data.
 * It then stores resulting escrows from the writeset changes in those transactions in the global
 * escrow store.
 */
function useSyncEscrowsFromTransactionStore(address: `0x${string}` | undefined) {
  const transactionsRef = useRef(
    address && globalUserTransactionStore.getState().addresses.get(address)
  );

  useEffect(
    () =>
      globalUserTransactionStore.subscribe(
        (state) => (transactionsRef.current = address && state.addresses.get(address)),
        (newTransactions, _prevTransactions) => {
          if (address && newTransactions) {
            globalEscrowStore.getState().processTransactions(...newTransactions);
          }
        }
      ),
    [address]
  );
}

export function useCurrentEscrow() {
  const user = useAccountAddress();
  const { meleeInfo } = useCurrentMeleeInfo();
  return useArenaEscrowStore((s) => {
    if (!user || !meleeInfo) return undefined;
    const res = s.addressMap.get(user)?.get(meleeInfo.meleeID);
    if (!res) return undefined;
    if (!isUserEscrow(res)) {
      console.warn("Match amount in current position/escrow is undefined somehow.");
      return {
        ...res,
        matchAmount: 0n,
        lockedIn: false,
      };
    }
    return res;
  });
}

export function useHistoricalEscrow(meleeID: bigint) {
  const user = useAccountAddress();

  return useArenaEscrowStore((s) => {
    if (!user) return undefined;
    return s.addressMap.get(user)?.get(meleeID);
  });
}

export function useArenaEscrowStore<T>(selector: (store: EscrowStore) => T): T {
  return useStore(globalEscrowStore, selector);
}
