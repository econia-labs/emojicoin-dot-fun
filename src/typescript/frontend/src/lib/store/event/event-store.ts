import { periodToPeriodTypeFromBroker } from "@econia-labs/emojicoin-sdk";
import {
  type BrokerEventModels,
  isChatEventModel,
  isEventModelWithMarket,
  isGlobalStateEventModel,
  isLiquidityEventModel,
  isMarketLatestStateEventModel,
  isMarketRegistrationEventModel,
  isPeriodicStateEventModel,
  isSwapEventModel,
} from "@sdk/indexer-v2/types";
import {
  isArenaCandlestickModel,
  isArenaEnterModel,
  isArenaExitModel,
  isArenaMeleeModel,
  isArenaModelWithMeleeID,
  isArenaSwapModel,
} from "@sdk/types/arena-types";
import { DEBUG_ASSERT, extractFilter } from "@sdk/utils";
import { encodeSymbolsForChart, isArenaChartSymbol } from "lib/chart-utils";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { ensureMeleeInStore, initializeArenaStore } from "../arena/store";
import {
  getMeleeIDFromArenaModel,
  handleLatestBarForArenaCandlestick,
  toMappedMelees,
} from "../arena/utils";
import { createWebSocketClientStore, type WebSocketClientStore } from "../websocket/store";
import {
  cleanReadLocalStorage,
  clearLocalStorage,
  LOCAL_STORAGE_EVENT_TYPES,
  maybeUpdateLocalStorage,
} from "./local-storage";
import { type EventStore, type SetLatestBarsArgs } from "./types";
import {
  ensureMarketInStore,
  handleLatestBarForPeriodicStateEvent,
  handleLatestBarForSwapEvent,
  initialState,
  toMappedMarketEvents,
} from "./utils";

export const createEventStore = () => {
  const store = createStore<EventStore & WebSocketClientStore>()(
    immer((set, get) => ({
      ...initialState(),
      ...initializeArenaStore(),
      getMarket: (emojis) => get().markets.get(emojis.join("")),
      getRegisteredMarkets: () => {
        return get().markets;
      },
      getMeleeMap: () => {
        return get().meleeMap;
      },
      loadArenaInfoFromServer: (info) => {
        set((state) => {
          state.arenaInfoFromServer = info;
          const arenaSymbol = encodeSymbolsForChart(
            info.emojicoin0Symbols.join(""),
            info.emojicoin1Symbols.join("")
          );
          ensureMeleeInStore(state, info.meleeID);
          state.meleeMap.set(arenaSymbol, info.meleeID);
        });
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
      loadEventsFromServer: (eventsIn: BrokerEventModels[]) => {
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

          const eventsWithMarket = events.filter(isEventModelWithMarket);
          const map = toMappedMarketEvents(eventsWithMarket);
          Array.from(map.entries()).forEach(([marketSymbol, marketEvents]) => {
            ensureMarketInStore(state, marketEvents[0].market);
            const market = state.markets.get(marketSymbol)!;
            market.swapEvents.push(...extractFilter(marketEvents, isSwapEventModel));
            market.chatEvents.push(...extractFilter(marketEvents, isChatEventModel));
            market.liquidityEvents.push(...extractFilter(marketEvents, isLiquidityEventModel));
            market.stateEvents.push(...extractFilter(marketEvents, isMarketLatestStateEventModel));
            // Drain the rest of the periodic state events to satisfy the assertion.
            const _ = extractFilter(marketEvents, isPeriodicStateEventModel);
            DEBUG_ASSERT(() => marketEvents.length === 0);
          });

          const arenaEvents = events.filter(isArenaModelWithMeleeID);
          const arenaMap = toMappedMelees(arenaEvents);
          Array.from(arenaMap.entries()).forEach(([meleeID, events]) => {
            ensureMeleeInStore(state, meleeID);
            const melee = state.melees.get(meleeID)!;
            melee.enters.push(...extractFilter(events, isArenaEnterModel));
            melee.exits.push(...extractFilter(events, isArenaExitModel));
            melee.swaps.push(...extractFilter(events, isArenaSwapModel));
            // Update all the latest bars for arena candlesticks.
            extractFilter(events, isArenaCandlestickModel).forEach((candlestick) => {
              handleLatestBarForArenaCandlestick(melee, candlestick);
            });
            DEBUG_ASSERT(() => events.length === 0);
          });
          state.meleeEvents.push(...extractFilter(arenaEvents, isArenaMeleeModel));
        });
      },
      pushEventsFromClient: (eventsIn: BrokerEventModels[], pushToLocalStorage = false) => {
        const guids = get().guids;
        const events = eventsIn.filter((e) => !guids.has(e.guid));
        if (!events.length) return;
        set((state) => {
          events.forEach((event) => {
            state.guids.add(event.guid);
            if (isGlobalStateEventModel(event)) {
              state.globalStateEvents.unshift(event);
            } else {
              if (isEventModelWithMarket(event)) {
                const marketMetadata = event.market;
                const symbol = marketMetadata.symbolData.symbol;
                ensureMarketInStore(state, marketMetadata);
                const market = state.markets.get(symbol)!;
                if (isSwapEventModel(event)) {
                  market.swapEvents.unshift(event);
                  handleLatestBarForSwapEvent(market, event);
                  maybeUpdateLocalStorage(pushToLocalStorage, "swap", event);
                } else if (isChatEventModel(event)) {
                  market.chatEvents.unshift(event);
                  maybeUpdateLocalStorage(pushToLocalStorage, "chat", event);
                } else if (isLiquidityEventModel(event)) {
                  market.liquidityEvents.unshift(event);
                  maybeUpdateLocalStorage(pushToLocalStorage, "liquidity", event);
                } else if (isMarketLatestStateEventModel(event)) {
                  market.stateEvents.unshift(event);
                  state.stateFirehose.unshift(event);
                  maybeUpdateLocalStorage(pushToLocalStorage, "market", event);
                } else if (isPeriodicStateEventModel(event)) {
                  handleLatestBarForPeriodicStateEvent(market, event);
                  maybeUpdateLocalStorage(pushToLocalStorage, "periodic", event);
                }
              } else {
                if (isArenaModelWithMeleeID(event)) {
                  const meleeID = getMeleeIDFromArenaModel(event);
                  ensureMeleeInStore(state, meleeID);
                  const melee = state.melees.get(meleeID)!;
                  if (isArenaMeleeModel(event)) {
                    state.meleeEvents.unshift(event);
                  } else if (isArenaEnterModel(event)) {
                    melee.enters.unshift(event);
                  } else if (isArenaExitModel(event)) {
                    melee.exits.unshift(event);
                  } else if (isArenaSwapModel(event)) {
                    melee.swaps.unshift(event);
                  } else if (isArenaCandlestickModel(event)) {
                    handleLatestBarForArenaCandlestick(melee, event);
                  }
                }
              }
            }
          });
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
      subscribeToPeriod: ({ symbol, period, cb }) => {
        if (isArenaChartSymbol(symbol)) {
          const meleeID = get().meleeMap.get(symbol);
          const melee = meleeID !== undefined && get().melees.has(meleeID);
          if (!melee) return;
          set((state) => {
            const melee = state.melees.get(meleeID)!;
            melee[period].callback = cb;
            const brokerPeriodType = periodToPeriodTypeFromBroker(period);
            state.client.subscribeToArenaPeriod(brokerPeriodType);
          });
        } else {
          if (!get().markets.has(symbol)) return;
          set((state) => {
            const market = state.markets.get(symbol)!;
            market[period].callback = cb;
          });
        }
      },
      unsubscribeFromPeriod: ({ symbol, period }) => {
        if (isArenaChartSymbol(symbol)) {
          const meleeID = get().meleeMap.get(symbol);
          const melee = meleeID !== undefined && get().melees.has(meleeID);
          if (!melee) return;
          set((state) => {
            const melee = state.melees.get(meleeID)!;
            melee[period].callback = undefined;
            const brokerPeriodType = periodToPeriodTypeFromBroker(period);
            state.client.unsubscribeFromArenaPeriod(brokerPeriodType);
          });
        } else {
          if (!get().markets.has(symbol)) return;
          set((state) => {
            const market = state.markets.get(symbol)!;
            market[period].callback = undefined;
          });
        }
      },
      ...createWebSocketClientStore(set, get),
    }))
  );

  const state = store.getState();
  for (const eventType of LOCAL_STORAGE_EVENT_TYPES) {
    try {
      const events = cleanReadLocalStorage(eventType);
      state.pushEventsFromClient(events);
    } catch (e) {
      console.error(e);
      clearLocalStorage(eventType);
    }
  }
  return store;
};
