import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";

type PnlModalStore = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const globalPnlModalStore = createStore<PnlModalStore>()(
  immer((set) => ({
    open: false,
    setOpen(open) {
      set((state) => {
        state.open = open;
      });
    },
  }))
);

export default function usePnlModalStore<T>(selector: (store: PnlModalStore) => T): T {
  return useStore(globalPnlModalStore, selector);
}
