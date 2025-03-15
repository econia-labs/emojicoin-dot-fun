"use client";

import React, { createContext, useContext, useRef } from "react";
import { useStore, type StoreApi } from "zustand";
import { createTransactionStore, type TransactionStore } from "@/store/transaction";

export const TransactionStoreContext = createContext<StoreApi<TransactionStore> | null>(null);

export const TransactionStoreProvider = ({ children }: React.PropsWithChildren) => {
  const store = useRef<StoreApi<TransactionStore>>();

  if (!store.current) {
    store.current = createTransactionStore();
  }
  return (
    <TransactionStoreContext.Provider value={store.current}>
      {children}
    </TransactionStoreContext.Provider>
  );
};

export const useTransactionStore = <T,>(selector: (store: TransactionStore) => T): T => {
  const transactionStore = useContext(TransactionStoreContext);

  if (transactionStore === null) {
    throw new Error("useTransactionStore must be used within a TransactionStoreProvider");
  }

  return useStore(transactionStore, selector);
};
