"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { useStore, type StoreApi } from "zustand";
import { createEscrowStore, type EscrowStore } from "./store";
import { useTransactionStore } from "../transaction/context-provider";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { Option } from "@sdk/utils";
import { findEscrows } from "@sdk/markets";

export const EscrowContext = createContext<StoreApi<EscrowStore> | null>(null);

export const EscrowStoreProvider = ({ children }: React.PropsWithChildren) => {
  const store = useRef<StoreApi<EscrowStore>>();

  if (!store.current) {
    store.current = createEscrowStore();
  }
  return <EscrowContext.Provider value={store.current}>{children}</EscrowContext.Provider>;
};

export const useEscrowStore = <T,>(selector: (store: EscrowStore) => T): T => {
  const escrowStore = useContext(EscrowContext);

  if (escrowStore === null) {
    throw new Error("useEscrowStore must be used within an EscrowContextProvider");
  }

  const { account } = useAptos();
  const transactions = useTransactionStore((s) =>
    Option(account)
      .map(({ address }) => s.accounts.get(address))
      .unwrapOr([])
  );

  useEffect(() => {
    transactions.map(findEscrows).forEach((v) => {
      // escrowStore.getState().
    });
  }, [transactions]);
  const asdf = escrowStore.getState();

  return useStore(escrowStore, selector);
};
