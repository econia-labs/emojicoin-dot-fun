"use client";

import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useStore, type StoreApi } from "zustand";
import { createEscrowStore, type EscrowStore } from "./store";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { Option } from "@sdk/utils";
import { globalTransactionStore } from "../transaction";

export const EscrowContext = createContext<StoreApi<EscrowStore> | null>(null);

export const EscrowStoreProvider = ({ children }: React.PropsWithChildren) => {
  const escrowStore = useRef<StoreApi<EscrowStore>>();

  if (!escrowStore.current) {
    escrowStore.current = createEscrowStore();
  }

  const { account: maybeAccount } = useAptos();
  const account = useMemo(() => Option(maybeAccount), [maybeAccount]);
  const transactionsRef = useRef(
    account.andThen(({ address }) => globalTransactionStore.getState().accounts.get(address))
  );

  useEffect(
    () =>
      globalTransactionStore.subscribe(
        (state) =>
          (transactionsRef.current = account.map(({ address }) => state.accounts.get(address))),
        (txns, _prevTxnStore) => {
          Option(escrowStore.current)
            .zip(txns)
            .map(([escrowStore, txns]) => {
              escrowStore.getState().pushTransactions(...txns);
            });
        }
      ),
    [account]
  );

  return <EscrowContext.Provider value={escrowStore.current}>{children}</EscrowContext.Provider>;
};

const useEscrowStore = <T,>(selector: (store: EscrowStore) => T): T => {
  const escrowStore = useContext(EscrowContext);

  if (escrowStore === null) {
    throw new Error("useEscrowStore must be used within an EscrowContextProvider");
  }

  return useStore(escrowStore, selector);
};

export const useUserEscrows = () => {
  const { account } = useAptos();

  return useEscrowStore((s) => s.escrows.get(account?.address ?? "0x"));
};
