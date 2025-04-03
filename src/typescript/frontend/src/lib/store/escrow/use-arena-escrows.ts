import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEffect, useMemo, useRef } from "react";
import { useStore } from "zustand";

import { toAccountAddressString, toUserEscrowJson } from "@/sdk/utils";
import { serverLog } from "@/sdk/utils/server-log";

import { globalTransactionStore } from "../transaction/store";
import type { EscrowStore } from "./store";
import { globalEscrowStore } from "./store";
import { useFetchArenaEscrows } from "./use-fetch-arena-escrows";

export const useArenaEscrows = () => {
  const { account } = useAptos();

  const accountAddress = useMemo(() => {
    return account?.address ? toAccountAddressString(account.address) : undefined;
  }, [account?.address]);

  useSyncEscrowsFromTransactionStore(accountAddress);
  const escrowsFromQuery = useFetchArenaEscrows(accountAddress);
  console.log(escrowsFromQuery);

  // Update the arena escrow store with whichever state is more recent between the query data
  // and the global transaction store.
  useEffect(() => {
    if (accountAddress && escrowsFromQuery) {
      serverLog({ data: escrowsFromQuery.map(toUserEscrowJson), label: "new escrows from query!" });
      globalEscrowStore.getState().pushIfLatest(accountAddress, ...escrowsFromQuery);
    }
  }, [accountAddress, escrowsFromQuery]);

  // Now get the currently connected user's escrow map in the store and return it. This returns
  // the mapping of meleeID => UserEscrow for this user/address.
  const escrows = useArenaEscrowStore((s) => accountAddress && s.addressMap.get(accountAddress));

  return escrows;
};

/**
 * See `useSyncBalanceFromTransactionStore` for a similar implementation and explanation.
 * This essentially processes incoming transactions for the currently connected user, specifically
 * for the arena escrow data.
 * It then stores resulting escrows from the writeset changes in those transactions in the global
 * escrow store.
 */
function useSyncEscrowsFromTransactionStore(address: `0x${string}` | undefined) {
  const transactionsRef = useRef(
    address && globalTransactionStore.getState().addresses.get(address)
  );

  useEffect(
    () =>
      globalTransactionStore.subscribe(
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

function useArenaEscrowStore<T>(selector: (store: EscrowStore) => T): T {
  return useStore(globalEscrowStore, selector);
}
