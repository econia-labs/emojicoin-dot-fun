import { useContext } from "react";
import { useStore } from "zustand";
import { NewCoinInputContext } from "./NewCoinInputContextProvider";
import { type  NewCoinInputStore } from "@/store/new-coin-input-store";

export const useNewCoinInput = <T,>(selector: (store: NewCoinInputStore) => T): T => {
  const newCoinInputContext = useContext(NewCoinInputContext);

  if (newCoinInputContext === null) {
    throw new Error("useNewCoinInput must be used within a NewCoinInputProvider");
  }

  return useStore(newCoinInputContext, selector);
};
