import type { StatsPageData } from "app/stats/(utils)/fetches";
import { createStore, useStore } from "zustand";
import { immer } from "zustand/middleware/immer";
import { shallow } from "zustand/shallow";

export type StatsPageState = {
  inner: StatsPageData | null;
  isLoading: boolean;
};

export type StatsPageActions = {
  getStableIsLoading(): boolean;
  setLoading(loading: boolean): void;
  update(args: NonNullable<StatsPageState["inner"]>): void;
};

export type StatsPageStore = StatsPageState & StatsPageActions;

export const globalStatsPageStore = createStore<StatsPageStore>()(
  immer((set, get) => ({
    inner: null,
    isLoading: true,
    getStableIsLoading() {
      return get().isLoading;
    },
    setLoading(loading) {
      set((state) => {
        state.isLoading = loading;
      });
    },
    update(newState) {
      const prev = get().inner;
      if (shallow(prev, newState)) return;
      set((state) => {
        state.inner = newState;
      });
    },
  }))
);

export function useStatsPageStore<T>(selector: (store: StatsPageStore) => T): T {
  return useStore(globalStatsPageStore, selector);
}
