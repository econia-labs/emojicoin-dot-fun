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
  initialStateStore,
  pushPeriodicStateEvents,
  toMappedMarketEvents,
} from "./utils";
import { periodEnumToRawDuration } from "@sdk/const";
import { joinEmojis } from "@sdk/emoji_data";
import { createWebSocketClientStore, type WebSocketClientStore } from "../websocket/store";
import { DEBUG_ASSERT, extractFilter } from "@sdk/utils";

export const createEventStore = () => {
  return createStore<EventStore & WebSocketClientStore>()(
    immer((set, get) => ({
      ...initialStateStore(),
      getMarket: (m) => get().markets.get(joinEmojis(m)),
      getRegisteredMarkets: () => {
        return get().markets;
      },
      loadMarketStateFromServer: (states) => {
        const filtered = states.filter((e) => {
          const marketEmojis = e.market.symbolEmojis;
          const symbol = joinEmojis(marketEmojis);
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
      ...createWebSocketClientStore(set, get),
    }))
  );
};
