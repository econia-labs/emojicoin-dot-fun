import {
  type AnyEventModel,
  isChatEventModel,
  isEventModelWithMarket,
  isGlobalStateEventModel,
  isLiquidityEventModel,
  isMarketLatestStateEventModel,
  isMarketRegistrationEventModel,
  isPeriodicStateEventModel,
  isSwapEventModel,
} from "@sdk/indexer-v2/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type SetLatestBarsArgs, type EventStore } from "./types";
import {
  ensureMarketInStore,
  handleLatestBarForPeriodicStateEvent,
  handleLatestBarForSwapEvent,
  pushPeriodicStateEvents,
} from "./utils";
import { addToLocalStorage, initialStateFromLocalStorage } from "./local-storage";
import { periodEnumToRawDuration } from "@sdk/const";
import { joinEmojis } from "@sdk/emoji_data";

export const createEventStore = () => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialStateFromLocalStorage(),
      getMarket: (m) => get().markets.get(joinEmojis(m)),
      getRegisteredMarkets: () => {
        return get().markets;
      },
      loadMarketStateFromServer: (states) => {
        const guids = get().guids;
        const filtered = states.filter((e) => {
          const marketEmojis = e.market.symbolEmojis;
          const symbol = joinEmojis(marketEmojis);
          const market = get().markets.get(symbol);
          // Filter by daily volume being undefined *or* the guid not already existing in `guids`.
          return !market || typeof market.dailyVolume === "undefined" || !guids.has(symbol);
        });
        filtered.forEach(addToLocalStorage);
        set((state) => {
          state.guids = state.guids.union(new Set(...filtered.map((e) => e.guid)));
          state.stateFirehose.push(...filtered);
          filtered.forEach(({ market: marketMetadata }) => {
            const symbol = marketMetadata.symbolData.symbol;
            ensureMarketInStore(state, marketMetadata);
            const market = state.markets.get(symbol)!;
            market.stateEvents.push(...filtered);
          });
        });
      },
      loadEventsFromServer: (eventsIn: Array<AnyEventModel>) => {
        const guids = get().guids;
        const events = eventsIn.filter((e) => !guids.has(e.guid));
        if (!events.length) return;
        events.forEach(addToLocalStorage);
        set((state) => {
          state.guids = state.guids.union(new Set(...events.map((e) => e.guid)));
          state.stateFirehose.push(...events.filter(isMarketLatestStateEventModel));
          state.globalStateEvents.push(...events.filter(isGlobalStateEventModel));
          state.marketRegistrations.push(...events.filter(isMarketRegistrationEventModel));
          const uniqueMarkets = new Set([...events.filter(isEventModelWithMarket)]);
          uniqueMarkets.forEach(({ market: marketMetadata }) => {
            const symbol = marketMetadata.symbolData.symbol;
            ensureMarketInStore(state, marketMetadata);
            const market = state.markets.get(symbol)!;
            market.swapEvents.push(...events.filter(isSwapEventModel));
            market.chatEvents.push(...events.filter(isChatEventModel));
            market.liquidityEvents.push(...events.filter(isLiquidityEventModel));
            market.stateEvents.push(...events.filter(isMarketLatestStateEventModel));
            pushPeriodicStateEvents(market, events.filter(isPeriodicStateEventModel));
          });
        });
      },
      pushEventFromClient: (event: AnyEventModel) => {
        if (get().guids.has(event.guid)) return;
        set((state) => {
          state.guids.add(event.guid);
          if (isGlobalStateEventModel(event)) {
            state.globalStateEvents.unshift(event);
          } else {
            const marketMetadata = event.market;
            const symbol = marketMetadata.symbolData.symbol;
            ensureMarketInStore(state, marketMetadata);
            const market = state.markets.get(symbol)!;
            if (isSwapEventModel(event)) {
              market.swapEvents.unshift(event);
              handleLatestBarForSwapEvent(market, event);
            } else if (isChatEventModel(event)) {
              market.chatEvents.unshift(event);
            } else if (isLiquidityEventModel(event)) {
              market.liquidityEvents.unshift(event);
            } else if (isMarketLatestStateEventModel(event)) {
              market.stateEvents.unshift(event);
              state.stateFirehose.unshift(event);
            } else if (isPeriodicStateEventModel(event)) {
              const period = periodEnumToRawDuration(event.periodicMetadata.period);
              market[period].candlesticks.unshift(event);
              handleLatestBarForPeriodicStateEvent(market, event);
            }
          }
        });
        addToLocalStorage(event);
      },
      setLatestBars: ({ marketMetadata, latestBars }: SetLatestBarsArgs) => {
        set((state) => {
          ensureMarketInStore(state, marketMetadata);
          const symbol = marketMetadata.symbolData.symbol;
          const market = state.markets.get(symbol)!;
          latestBars.forEach((bar) => {
            const period = bar.period;
            market[period].latestBar = bar;
          });
        });
      },
      subscribeToPeriod: ({ marketEmojis, period, cb }) => {
        const symbol = joinEmojis(marketEmojis);
        if (!get().markets.has(symbol)) return;
        set((state) => {
          const market = state.markets.get(symbol)!;
          market[period].callback = cb;
        });
      },
      unsubscribeFromPeriod: ({ marketEmojis, period }) => {
        const symbol = joinEmojis(marketEmojis);
        if (!get().markets.has(symbol)) return;
        set((state) => {
          const market = state.markets.get(symbol)!;
          market[period].callback = undefined;
        });
      },
    }))
  );
};
