import {
  type AnyEventModel,
  type EventModelWithMarket,
  isChatEventModel,
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
  toMappedMarketEvents,
  initialState,
} from "./utils";
import { periodEnumToRawDuration } from "@sdk/const";
import { createWebSocketClientStore, type WebSocketClientStore } from "../websocket/store";
import { DEBUG_ASSERT, extractFilter } from "@sdk/utils";
import {
  updateLocalStorage,
  cleanReadLocalStorage,
  clearLocalStorage,
  LOCAL_STORAGE_EVENT_TYPES,
} from "./local-storage";

export const createEventStore = () => {
  const store = createStore<EventStore & WebSocketClientStore>()(
    immer((set, get) => ({
      ...initialState(),
      getMarket: (emojis) => get().markets.get(emojis.join("")),
      getRegisteredMarkets: () => {
        return get().markets;
      },
      loadMarketStateFromServer: (states) => {
        const filtered = states.filter((e) => {
          const marketEmojis = e.market.symbolEmojis;
          const symbol = marketEmojis.join("");
          const market = get().markets.get(symbol);
          // Filter by daily volume being undefined *or* the guid not already existing in `guids`.
          return !market || typeof market.dailyVolume === "undefined" || !get().guids.has(symbol);
        });
        set((state) => {
          filtered.map(({ guid }) => state.guids.add(guid));
          state.stateFirehose.push(...filtered);
          const map = toMappedMarketEvents(filtered);
          Array.from(map.entries()).forEach(([marketSymbol, marketEvents]) => {
            ensureMarketInStore(state, marketEvents[0].market);
            const market = state.markets.get(marketSymbol)!;
            marketEvents.forEach((event) => market.stateEvents.push(event));
          });
        });
      },
      loadEventsFromServer: (eventsIn: Array<AnyEventModel>) => {
        const guids = get().guids;
        const events = eventsIn.filter((e) => !guids.has(e.guid));
        if (!events.length) return;
        // Note the behavior of `extractFilter` below:
        // It drains and returns the input array of the type filtered on in the filter function.
        // The input array thus gets smaller each time `extractFilter` finds any matching events.
        set((state) => {
          events.map(({ guid }) => state.guids.add(guid));
          state.stateFirehose.push(...events.filter(isMarketLatestStateEventModel));
          state.globalStateEvents.push(...extractFilter(events, isGlobalStateEventModel));
          state.marketRegistrations.push(...extractFilter(events, isMarketRegistrationEventModel));
          DEBUG_ASSERT(() => !events.some(isGlobalStateEventModel));
          const map = toMappedMarketEvents(events as Array<EventModelWithMarket>);
          Array.from(map.entries()).forEach(([marketSymbol, marketEvents]) => {
            ensureMarketInStore(state, marketEvents[0].market);
            const market = state.markets.get(marketSymbol)!;
            market.swapEvents.push(...extractFilter(marketEvents, isSwapEventModel));
            market.chatEvents.push(...extractFilter(marketEvents, isChatEventModel));
            market.liquidityEvents.push(...extractFilter(marketEvents, isLiquidityEventModel));
            market.stateEvents.push(...extractFilter(marketEvents, isMarketLatestStateEventModel));
            pushPeriodicStateEvents(market, extractFilter(marketEvents, isPeriodicStateEventModel));
            DEBUG_ASSERT(() => marketEvents.length === 0);
          });
        });
      },
      pushEventFromClient: (event: AnyEventModel, pushToLocalStorage = false) => {
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
              if (pushToLocalStorage) {
                updateLocalStorage("swap", event);
              }
            } else if (isChatEventModel(event)) {
              market.chatEvents.unshift(event);
              if (pushToLocalStorage) {
                updateLocalStorage("chat", event);
              }
            } else if (isLiquidityEventModel(event)) {
              market.liquidityEvents.unshift(event);
              if (pushToLocalStorage) {
                updateLocalStorage("liquidity", event);
              }
            } else if (isMarketLatestStateEventModel(event)) {
              market.stateEvents.unshift(event);
              state.stateFirehose.unshift(event);
              if (pushToLocalStorage) {
                updateLocalStorage("market", event);
              }
            } else if (isPeriodicStateEventModel(event)) {
              const period = periodEnumToRawDuration(event.periodicMetadata.period);
              market[period].candlesticks.unshift(event);
              handleLatestBarForPeriodicStateEvent(market, event);
              if (pushToLocalStorage) {
                updateLocalStorage("periodic", event);
              }
            }
          }
        });
      },
      setLatestBars: ({ marketMetadata, latestBars }: SetLatestBarsArgs) => {
        set((state) => {
          ensureMarketInStore(state, marketMetadata);
          const symbol = marketMetadata.symbolData.symbol;
          const market = state.markets.get(symbol)!;
          latestBars.forEach((bar) => {
            const period = bar.period;
            // A bar's open should never be zero, so use the previous bar if it exists and isn't 0,
            // otherwise, use the existing current bar's close.
            if (bar.open === 0) {
              const prevLatestBarClose = market[period].latestBar?.close;
              if (prevLatestBarClose) {
                bar.open = prevLatestBarClose;
              } else {
                bar.open = bar.close;
              }
            }
            market[period].latestBar = bar;
          });
        });
      },
      subscribeToPeriod: ({ marketEmojis, period, cb }) => {
        const symbol = marketEmojis.join("");
        if (!get().markets.has(symbol)) return;
        set((state) => {
          const market = state.markets.get(symbol)!;
          market[period].callback = cb;
        });
      },
      unsubscribeFromPeriod: ({ marketEmojis, period }) => {
        const symbol = marketEmojis.join("");
        if (!get().markets.has(symbol)) return;
        set((state) => {
          const market = state.markets.get(symbol)!;
          market[period].callback = undefined;
        });
      },
      ...createWebSocketClientStore(set, get),
    }))
  );

  const state = store.getState();
  for (const eventType of LOCAL_STORAGE_EVENT_TYPES) {
    try {
      const events = cleanReadLocalStorage(eventType);
      for (const event of events) {
        state.pushEventFromClient(event);
      }
    } catch (e) {
      console.error(e);
      clearLocalStorage(eventType);
    }
  }
  return store;
};
