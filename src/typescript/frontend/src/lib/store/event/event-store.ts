import { encodeSymbolsForChart, isArenaChartSymbol } from "lib/chart-utils";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { periodToPeriodTypeFromBroker } from "@/broker/index";
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
} from "@/sdk/indexer-v2/types";
import {
  isArenaCandlestickModel,
  isArenaEnterModel,
  isArenaExitModel,
  isArenaMeleeModel,
  isArenaModelWithMeleeID,
  isArenaSwapModel,
} from "@/sdk/types/arena-types";
import { compareBigInt, DEBUG_ASSERT, extractFilter } from "@/sdk/utils";

import {
  ensureMeleeInStore,
  initializeArenaStore,
  updateRewardsRemainingAndVaultBalance,
} from "../arena/event/store";
import {
  getMeleeIDFromArenaModel,
  handleLatestBarForArenaCandlestick,
  toMappedMelees,
} from "../arena/event/utils";
import { createWebSocketClientStore, type WebSocketClientStore } from "../websocket/store";
import {
  cleanReadLocalStorage,
  clearLocalStorage,
  LOCAL_STORAGE_EVENT_TYPES,
  maybeUpdateLocalStorage,
} from "./local-storage";
import type { EventStore, SetLatestBarsArgs } from "./types";
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
      getMarket: (emojis = []) => get().markets.get(emojis.join("")),
      getMarketLatestState: (emojis = []) => {
        if (!emojis || !emojis.length) return undefined;
        const market = get().markets.get(emojis.join(""));
        const latestState = market?.stateEvents.at(0);
        if (!market || !latestState) return undefined;
        // Note that volumes are only properly propagated/set in state when `loadMarketStateFromServer` is
        // called. The volumes are optional because sometimes they're missing when data is loaded
        // from live events rather than as a result of the indexer view with daily volumes.
        return {
          ...latestState,
          dailyVolume: market.dailyVolume ?? 0n,
          dailyBaseVolume: market.dailyBaseVolume ?? 0n,
        };
      },
      getRegisteredMarkets: () => {
        return get().markets;
      },
      getMeleeMap: () => {
        return get().meleeMap;
      },
      loadArenaInfoFromServer: (info) => {
        // Don't update if the data is stale/outdated.
        if ((get().arenaInfoFromServer?.version ?? -1n) > info.version) return;
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
      loadVaultBalanceFromServer: (vaultBalance) => {
        set((state) => {
          state.vaultBalance = vaultBalance;
        });
      },
      loadMarketStateFromServer: (states) => {
        const filtered = states.filter((e) => {
          const marketEmojis = e.market.symbolEmojis;
          const symbol = marketEmojis.join("");
          const market = get().markets.get(symbol);
          // Filter by the current market store state's daily volume being undefined *or* the guid
          // not already existing in `guids`.
          // This to ensure that if `dailyVolume` is added, the data will still update, even if
          // the guid already exists in state.
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
            // Sort in reverse order (b, a), aka descending, aka highest nonce first.
            // This sorts on each insertion but we only ever insert 1 or 2 at a time so it's fine.
            market.stateEvents.sort((a, b) =>
              compareBigInt(b.market.marketNonce, a.market.marketNonce)
            );
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

          const meleeEventModels = extractFilter(arenaEvents, isArenaMeleeModel);
          meleeEventModels.forEach((model) => {
            ensureMeleeInStore(state, model.melee.meleeID);
            state.meleeEvents.push(model);
          });
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
              updateRewardsRemainingAndVaultBalance(state, event);
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

  // Return early to avoid state mutations based on localStorage.
  if (typeof window === "undefined") {
    return store;
  }

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
