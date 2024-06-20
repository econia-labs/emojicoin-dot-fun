import { type WritableDraft } from "immer";
import { type StoreApi } from "zustand";

// The type of the `set((state) => ...)` function for the `immer` library.
export type ImmerSetStore<T> = (
  nextStateOrUpdater: T | Partial<T> | ((state: WritableDraft<T>) => void),
  shouldReplace?: boolean | undefined
) => void;

// The type of the `set((state) => ...)` function for the `zustand` library.
export type ZustandSetStore<T> = StoreApi<T>["setState"];
