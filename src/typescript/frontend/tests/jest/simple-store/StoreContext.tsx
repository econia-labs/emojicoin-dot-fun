import React, { type ReactNode, createContext, useContext, useRef } from "react";
import { create, createStore, type StoreApi } from "zustand";
import { useStoreWithEqualityFn } from "zustand/traditional";
import { shallow } from "zustand/shallow";

type Store = {
  count: number;
  increment: () => void;
};

const useStore = create<Store>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

const Context = createContext<StoreApi<Store> | undefined>(undefined);

const Provider = ({ children }: { children: ReactNode }) => {
  const ref = useRef<StoreApi<Store>>();
  if (!ref.current) {
    ref.current = createStore<Store>()((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));
  }
  return <Context.Provider value={ref.current}>{children}</Context.Provider>;
};

type ContextSelector<T> = (store: Store) => T;

const useStoreContext = <T,>(selector: ContextSelector<T>): T => {
  const context = useContext(Context);

  if (typeof context === "undefined") {
    throw new Error("useStoreContext must be used within Provider.");
  }

  return useStoreWithEqualityFn(context, selector, shallow);
};

const JestStore = {
  useStore,
  useStoreContext,
  Provider,
};

export default JestStore;
