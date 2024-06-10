import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";

export type MarketDataState = {
  numMarkets: number;
};

export type MarketDataActions = {
  setNumMarkets: (numMarkets: number) => void;
};

export type MarketDataStore = MarketDataState & MarketDataActions;

export const createMarketDataStore = (initial?: MarketDataStore) => {
  return createStore<MarketDataStore>()(
    immer((set) => ({
      numMarkets: initial?.numMarkets ?? 0,
      setNumMarkets: (numMarkets: number) =>
        set((state) => {
          state.numMarkets = numMarkets;
        }),
    }))
  );
};
