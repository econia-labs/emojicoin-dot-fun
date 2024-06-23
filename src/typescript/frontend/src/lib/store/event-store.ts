import { type AnyHomogenousEvent, type AnyEmojicoinEvent, type Types } from "@sdk/types/types";
import { createStore } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";
import { type AnyNumberString } from "@sdk-types";
import {
  CandlestickResolution,
  RESOLUTIONS_ARRAY,
  toCandlestickResolution,
} from "@sdk/const";
import { type DBJsonData } from "@sdk/emojicoin_dot_fun";
import { type AnyEmojicoinJSONEvent } from "@sdk/types/json-types";
import { type WritableDraft } from "immer";
import {
  type MarketIDString,
  type SymbolString,
  isSwapEventFromDB,
  deserializeEvent,
  isGlobalStateEventFromDB,
  isStateEventFromDB,
  isPeriodicStateEventFromDB,
  isChatEventFromDB,
  isLiquidityEventFromDB,
  isMarketRegistrationEventFromDB,
} from "./event-utils";
import { symbolBytesToEmojis } from "@sdk/emoji_data";
import { type HexInput } from "@aptos-labs/ts-sdk";
import { type DetailedMarketMetadata } from "lib/queries/types";
import { type SubscribeBarsCallback } from "@static/charting_library/datafeed-api";
import {
  type LatestBar,
  createLatestBarFromSwaps,
  createNewLatestBar,
  toBar,
} from "@sdk/utils/candlestick-bars";
import { getPeriodBoundary, getPeriodBoundaryFromTime } from "@sdk/utils";
import { q64ToBig } from "@sdk/utils/nominal-price";
import { toHomogenousEvents, type HomogenousEventStructure } from "@sdk/emojicoin_dot_fun/events";

type SwapEvent = Types.SwapEvent;
type ChatEvent = Types.ChatEvent;
type MarketRegistrationEvent = Types.MarketRegistrationEvent;
type PeriodicStateEvent = Types.PeriodicStateEvent;
type StateEvent = Types.StateEvent;
type LiquidityEvent = Types.LiquidityEvent;
type GlobalStateEvent = Types.GlobalStateEvent;
type MarketDataView = Types.MarketDataView;

// TODO: Pass data from server components down to client components
// to reinitialize the store with the data from the server.

export type CandlestickResolutionData = {
  events: readonly PeriodicStateEvent[];
  callback: SubscribeBarsCallback | undefined;
  latestBar: LatestBar | undefined;
};

export type EventsWithGUIDs = {
  swapEvents: readonly SwapEvent[];
  chatEvents: readonly ChatEvent[];
  stateEvents: readonly StateEvent[];
  liquidityEvents: readonly LiquidityEvent[];
  [CandlestickResolution.PERIOD_1S]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_5S]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_15S]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_30S]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_1M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_5M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_15M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_30M]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_1H]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_4H]: CandlestickResolutionData | undefined;
  [CandlestickResolution.PERIOD_1D]: CandlestickResolutionData | undefined;
};

export type MarketStateValueType = EventsWithGUIDs & {
  marketData?: MarketDataView;
};

// Note the usage of readonly here (and above) is to prevent accidental mutations.
// The readonly attribute doesn't indicate these will never change- just that they should only
// be mutated by zustand/immer.
export type EventState = {
  guids: Readonly<Set<string>>;
  firehose: readonly AnyEmojicoinEvent[];
  markets: Readonly<Map<MarketIDString, MarketStateValueType>>;
  symbols: Readonly<Map<SymbolString, MarketIDString>>;
  globalStateEvents: readonly GlobalStateEvent[];
  marketRegistrationEvents: readonly MarketRegistrationEvent[];
  // This will very rarely, if ever, be mutated. This is used primarily for supplying the
  // TradingView chart with symbol search data.
  marketMetadataMap: Readonly<Map<MarketIDString, DetailedMarketMetadata>>;
};

// type SetLatestBarArgs = {
//   marketID: MarketIDString;
//   resolution: CandlestickResolution;
//   bar: LatestBar;
// };

export type PushEventsData = {
  eventsIn: Array<AnyHomogenousEvent> | HomogenousEventStructure;
  latestBarData?: LatestBarData;
};

export type LatestBarData = Array<{
  resolution: CandlestickResolution;
  bar: LatestBar;
}>;

type ResolutionSubscription = {
  symbol: string;
  resolution: CandlestickResolution;
  cb: SubscribeBarsCallback;
};

export type EventActions = {
  initializeMarket: (marketID: AnyNumberString, symbolOrBytes?: HexInput) => void;
  getMarket: (marketID: AnyNumberString) => MarketStateValueType | undefined;
  getMarketMetadata: (marketID: AnyNumberString) => DetailedMarketMetadata | undefined;
  getSymbols: () => Map<SymbolString, MarketIDString>;
  getMarketIDFromSymbol: (symbol: SymbolString) => MarketIDString | undefined;
  pushEvents: ({ eventsIn, latestBarData }: PushEventsData) => void;
  pushEventFromWebSocket: (buffer: Buffer) => void;
  addMarketData: (d: MarketDataView) => void;
  // setLatestBar: ({ marketID, resolution, bar }: SetLatestBarArgs) => void;
  setLatestBars: ({
    marketID,
    latestBarData,
  }: {
    marketID: MarketIDString;
    latestBarData: LatestBarData;
  }) => void;
  initializeMarketMetadata: (data: Array<DetailedMarketMetadata>) => void;
  subscribeToResolution: ({ symbol, resolution, cb }: ResolutionSubscription) => void;
  unsubscribeFromResolution: ({ symbol, resolution }: Omit<ResolutionSubscription, "cb">) => void;
  pushGlobalStateEvent: (event: GlobalStateEvent) => void;
  pushMarketRegistrationEvent: (event: MarketRegistrationEvent) => void;
};

export type EventStore = EventState & EventActions;

export const initializeEventStore = (): EventState => {
  return {
    guids: new Set(),
    firehose: [],
    markets: new Map(),
    symbols: new Map(),
    globalStateEvents: [],
    marketRegistrationEvents: [],
    marketMetadataMap: new Map(),
  };
};

const createInitialCandlestickData = () => ({
  events: [] as PeriodicStateEvent[],
  callback: undefined,
  latestBar: undefined,
});

export const getInitialMarketState = () => ({
  swapEvents: [],
  liquidityEvents: [],
  stateEvents: [],
  chatEvents: [],
  marketData: undefined,
  [CandlestickResolution.PERIOD_1S]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_5S]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_15S]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_30S]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_1M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_5M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_15M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_30M]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_1H]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_4H]: createInitialCandlestickData(),
  [CandlestickResolution.PERIOD_1D]: createInitialCandlestickData(),
});

export const defaultState: EventState = initializeEventStore();

export const initializeMarketHelper = (
  state: WritableDraft<EventState>,
  marketID: AnyNumberString,
  symbolOrBytes?: HexInput
) => {
  const id = marketID.toString();
  if (!state.markets.has(id)) {
    state.markets.set(id, getInitialMarketState());
  }
  if (symbolOrBytes) {
    const symbol = symbolBytesToEmojis(symbolOrBytes).symbol;
    if (!state.symbols.has(symbol)) {
      state.symbols.set(symbol, id);
    }
  }
  console.log(state.markets);
};

/**
 * This function is intended to be called when new swap events are recorded in the event store or
 * the WebSocket store. It will iterate over all resolutions for the given market and update the
 * latest bar fields if the incoming swap event should change them.
 *
 * The period must be the same due to a limitation of the TradingView API, since we cannot update a
 * historical bar using the
 * {@link https://www.tradingview.com/charting-library-docs/v25/connecting_data/Datafeed-API/#subscribebars subscribeBars callback}.
 * Thus we must return early if the incoming bar is older than the existing latest bar.
 *
 * If the periods are the same we update the bar based on the following logic:
 *   If the incoming swap price is higher than the current latest bar's high, we update it.
 *   If the incoming swap price is lower than the current latest bar's low, we update it.
 *   ...etc
 *
 * The TradingView API updates the latest bar by updating the bar data as long as the time
 * field is exactly the same as the current latest bar. If the time is different, it will either
 * throw an error if the time is in the past or it will create a new bar if the time is ahead of
 * the current latest bar.
 *
 * Note that our datafeed is receiving latest bar data from two data sources:
 *   1. The latest swap event (99% of the time).
 *   2. Periodic state events. When one of these comes in, it means the bar is complete. That is,
 *      the data ossifies (becomes immutable) and we can no longer update the bar for that period.
 *
 * Because we can't retroactively update data, we must ensure that the final update will **always**
 * come from the periodic state event, i.e., the final, immutable bar data.
 *
 * We can ensure accurate data by following these rules:
 * 1. We only ever **update** the existing bar when the data is coming in from a swap event.
 * 2. We **never** ossify the existing bar when we receive a swap event.
 * 3. We **always** immediately ossify the existing bar into historical data and create a new latest
 *    bar when we receive data from a periodic state event. We handle this in the event store's
 *    `pushEvents` and `pushEventFromWebSocket` functions.
 * 4. We must also ensure we aren't double recording volume data. We track this with a set of guids.
 * 5. The `time` field in each bar is actually the period boundary, i.e., the time at which the bar
 *    starts for PeriodicStateEvents, and the time at which the bar ends for SwapEvents.
 *
 * To demonstrate a simple intuitive example, the data might come in like this:
 *   swap, swap, swap, swap, swap, periodic_state_event
 *
 * If it came in like this:
 *   swap, swap, swap, periodic_state_event, swap, swap
 *
 * Then the last two swaps are ignored because their period boundaries would be behind.
 *
 * This ensures that stale data from WebSocket events will be ignored while still allowing the
 * TradingView chart to update in real-time with the latest swap data.
 *
 * We could run checks on this to avoid redundant and unnecessary updates if this becomes a
 * performance issue.
 *
 * @param state The current state of the event store.
 * @param swap The swap event to update the latest bar with.
 * @returns void (mutates the state). This should only be called within an immer block.
 *
 */
export const updateLatestBarOld = ({
  state, // Not a state event- this is the event store state.
  swap,
}: {
  state: WritableDraft<EventState>;
  swap: Types.SwapEvent;
}) => {
  const marketID = swap.marketID.toString();
  const market = state.markets.get(marketID);
  if (!market) return;
  const resolutions = RESOLUTIONS_ARRAY;
  resolutions.forEach((resolution) => {
    const data = market[resolution]!;
    if (!data.latestBar) {
      console.log("initializing bar data from swaps. consider timeout here.?");
      data.latestBar = createLatestBarFromSwaps(market.swapEvents, resolution);
    }

    // Return early if the swap event is stale or has already been recorded.
    if (data.latestBar.guids.has(swap.guid)) return;
    if (getPeriodBoundary(swap, resolution) <= data.latestBar.periodBoundary) return;

    // Now we can update the bar with the incoming swap event.
    data.latestBar.guids.add(swap.guid);
    const price = q64ToBig(swap.avgExecutionPrice).toNumber();
    data.latestBar.close = price;
    data.latestBar.high = Math.max(data.latestBar.high, price);
    data.latestBar.low = Math.min(data.latestBar.low, price);
    data.latestBar.volume += Number(swap.baseVolume);
  });
};

export const updateLatestBar = ({
  state,
  swap,
}: {
  state: WritableDraft<EventState>;
  swap: Types.SwapEvent;
}) => {
  const marketID = swap.marketID.toString();
  const market = state.markets.get(marketID);
  if (!market) return;
  const resolutions = Object.values(CandlestickResolution) as Array<CandlestickResolution>;
  resolutions.forEach((resolution) => {
    const data = market[resolution];
    if (!data) return;
    if (!data.latestBar) {
      console.error("No latest bar found for resolution:", resolution);
      return;
    }
    if (data.latestBar.guids.has(swap.guid)) return;
    if (getPeriodBoundary(swap, resolution) <= data.latestBar.periodBoundary) return;
    data.latestBar.guids.add(swap.guid);
    const price = q64ToBig(swap.avgExecutionPrice).toNumber();
    data.latestBar.close = price;
    data.latestBar.high = Math.max(data.latestBar.high, price);
    data.latestBar.low = Math.min(data.latestBar.low, price);
    data.latestBar.volume += Number(swap.baseVolume);
  });
};

/*
export const updateLatestBar2 = ({
  state, // Not a state event- this is the event store state.
  swap,
}: {
  state: WritableDraft<EventState>;
  swap: Types.SwapEvent;
}) => {
  const marketID = swap.marketID.toString();
  const market = state.markets.get(marketID);
  // if (!market) {
  //   initializeMarketHelper(state, marketID);
  // }
  if (!market) return;
  const resolutions = Object.values(CandlestickResolution) as Array<CandlestickResolution>;
  resolutions.forEach((resolution) => {
    // We know all candlestick data has been initialized in the `initializeMarketHelper` above.
    const data = market[resolution];
    if (!data) {
      throw new Error(`Candlestick data ${data} not initialized for resolution: ${resolution}`);
    }

    // Get the period boundary for the incoming swap event.
    const swapPeriodBoundary = getPeriodBoundary(swap, resolution);

    // // If the latest bar is not set, we must create a new bar from the existing swap events.
    // if (typeof data.latestBar === "undefined") {
    //   // Swaps should be ordered, and we're only creating the *latest* bar which means
    //   // we only care about the latest swap event's period boundary.
    //   if (market.swapEvents.length === 0) {
    //     data.latestBar = swapToNewLatestBar(swap, resolution);
    //     return;
    //   }

    //   // We only use swap events that exist within the latest bar period for the same resolution.
    //   const swaps = market.swapEvents.filter(
    //     (ev) => swapPeriodBoundary === getPeriodBoundary(ev, resolution)
    //   );
    //   // Add the incoming swap event to the list of swaps.
    //   if (swaps.length === 0 || swaps.at(0)!.time < swap.time) {
    //     swaps.unshift(swap);
    //   } else if (swaps.at(-1)!.time > swap.time) {
    //     swaps.push(swap);
    //   } else {
    //     // This is a rare case where the incoming swap event is in the middle of the existing swaps.
    //     throw new Error("Incoming swap event is in the middle of existing swaps.");
    //   }

    //   const period = toCandlestickResolution(swapPeriodBoundary);
    //   if (!period) {
    //     throw new Error(`Invalid period: ${period}`);
    //   }

    //   // Then create the latest bar from all of the swaps- the existing swaps and the incoming swap.
    //   data.latestBar = createLatestBarFromSwaps(swaps, period);
    //   return;
    // }
    // If the latest bar has already recorded this swap event's data or it's an old period boundary,
    // we can return early.
    if (data.latestBar.guids.has(swap.guid) || swapPeriodBoundary <= data.latestBar.periodBoundary)
      return;

    // Now that we have verified the existing bar should be updated, we update it with
    // candlestick bar logic for each field and add the swap's guid to the guids set.
    data.latestBar.guids.add(swap.guid);
    const price = q64ToBig(swap.avgExecutionPrice).toNumber();
    data.latestBar.close = price;
    data.latestBar.high = Math.max(data.latestBar.high, price);
    data.latestBar.low = Math.min(data.latestBar.low, price);
    data.latestBar.volume += Number(swap.baseVolume);
  });
};
*/

// This should REALLY use classes, I just didn't know you could use classes with
// immer when making this.
export const createEventStore = (initialState: EventState = defaultState) => {
  return createStore<EventStore>()(
    immer((set, get) => ({
      ...initialState,
      initializeMarket: (marketID, symbolOrBytes) =>
        set((state) => initializeMarketHelper(state, marketID, symbolOrBytes)),
      getSymbols: () => get().symbols,
      getMarketIDFromSymbol: (symbol) => get().symbols.get(symbol),
      getMarket: (marketID) => {
        return get().markets.get(marketID.toString())!;
      },
      addMarketData: (data) => {
        const marketID = data.marketID.toString();
        set((state) => {
          const market = state.markets.get(marketID);
          if (!market) {
            initializeMarketHelper(state, marketID, data.emojiBytes);
          }
          state.markets.get(marketID)!.marketData = data;
        });
      },
      setLatestBars: ({ marketID, latestBarData }) => {
        set((state) => {
          const market = state.markets.get(marketID.toString());
          if (!market) {
            initializeMarketHelper(state, marketID);
          }
          latestBarData.forEach(({ resolution, bar }) => {
            console.log(resolution);
            console.log({ ...market![resolution] });
            market![resolution]!.latestBar = bar;
          });
        });
      },
      pushGlobalStateEvent: (event) => {
        set((state) => {
          if (state.guids.has(event.guid)) return;
          state.globalStateEvents.push(event);
          state.guids.add(event.guid);
        });
      },
      pushMarketRegistrationEvent: (event) => {
        set((state) => {
          if (state.guids.has(event.guid)) return;
          state.marketRegistrationEvents.push(event);
          state.guids.add(event.guid);
        });
      },
      // Because these often come from queries, we only do state updates in chunks with arrays.
      // Note that the events here are assumed to be sorted in descending order already, aka
      // latest first.
      pushEvents: ({ eventsIn, latestBarData }) => {
        console.log("PUSH EVENTS LATST BAR DATA", latestBarData);
        let events: HomogenousEventStructure | undefined;
        if (Array.isArray(eventsIn)) {
          events = toHomogenousEvents(eventsIn, get().guids);
        } else {
          events = eventsIn;
        }
        // If no events are found, we return early.
        if (!events) return;

        set((state) => {
          // toHomogenousEvents already filtered out guids and ensured there is only one marketID.
          events.guids.forEach((guid) => state.guids.add(guid));
          state.firehose.push(
            ...[
              ...events.swapEvents,
              ...events.stateEvents,
              ...events.chatEvents,
              ...events.liquidityEvents,
            ]
          );
          if (!events.marketID) {
            throw new Error("No market ID or global state events found.");
          }
          const marketID = events.marketID.toString();
          if (!state.markets.has(marketID)) {
            initializeMarketHelper(state, marketID);
          }
          const market = state.markets.get(marketID)!;
          market.swapEvents.push(...events.swapEvents);
          market.stateEvents.push(...events.stateEvents);
          market.chatEvents.push(...events.chatEvents);
          market.liquidityEvents.push(...events.liquidityEvents);

          // If `latestBarData` is passed, it means we're initializing the data and thus
          // we don't need to calculate the latest bar based on swaps or periodic events.
          // Push the periodic state events and add the latest bar data to the market state.
          if (latestBarData) {
            if (latestBarData.length !== RESOLUTIONS_ARRAY.length) {
              throw new Error(
                [
                  "Invalid number of latest bars:",
                  latestBarData.length,
                  " should be:",
                  RESOLUTIONS_ARRAY.length,
                ].join(" ")
              );
            }
            latestBarData.forEach(({ resolution, bar }) => {
              const periodicEvents = market[resolution]!;
              periodicEvents.events.push(...events.candlesticks[resolution]);
              market[resolution]!.latestBar = bar;
            });
            return;
          } else {
            // Otherwise, the `latestBar` for each market resolution must already exist,
            // because we can't meaningfully update the latest bar without having exhaustively
            // fetched all the swap events in that period for the given market and resolution.
            RESOLUTIONS_ARRAY.forEach((resolution) => {
              if (typeof market[resolution]?.latestBar === "undefined") {
                throw new Error("Latest bar not initialized for resolution: " + resolution);
              }
              const latestBar = market[resolution]!.latestBar!;
              // Check if the latest bar period is one period further along than the latest
              // periodic state event. If not, that means it's stale, and we need to create a new
              // one. If it is, we can just update the latest bar with the incoming swap events.
              const latestBarPeriodBoundary = getPeriodBoundaryFromTime(
                BigInt(latestBar.time * 1000),
                resolution
              );
              const latestPeriodicStateEventPeriodBoundary =
                events.candlesticks[resolution].at(0)?.periodicStateMetadata.startTime ?? -1n;
              if (latestBarPeriodBoundary <= latestPeriodicStateEventPeriodBoundary) {
                // Create a new bar from the latest periodic state event.
                market[resolution]!.latestBar = createNewLatestBar(
                  events.candlesticks[resolution].at(0)!
                );
              } else {
                // Update the latest bar with the incoming swap events.
                events.swapEvents.forEach((swap) => {
                  updateLatestBar({ state, swap });
                });
              }
            });
          }

          // Push all candlestick events into their respective resolutions.
          RESOLUTIONS_ARRAY.forEach((resolution) => {
            // const periodicEvents = market[resolution]!;
            // if (!periodicEvents || periodicEvents.latestBar) {
            //   throw new Error(`This should never happen.`);
            // }
            // periodicEvents.events.push(...events.candlesticks[resolution]);
            // events.swapEvents.forEach((swap) => {
            //   updateLatestBarOld({ state, swap });
            // });

            /*
            const latestCandlestick = periodicEvents.events.at(0);
            const latestBar = periodicEvents.latestBar;
            if (latestBar || latestCandlestick) {
              // The latest bar period boundary always needs to be greater than the latest
              // candlestick period boundary, or we should create a new bar.
              if (latestBar && latestCandlestick) {
                if (latestBar.periodBoundary <= getNextPeriodBoundary(latestCandlestick)) {
                  periodicEvents.latestBar = createNewLatestBar(latestCandlestick);
                }
              } else if (!latestBar && latestCandlestick) {
                // If we don't have the latest bar, we can initialize it with the latest candlestick
                // by creating a bar with the next period after the latest candlestick.
                periodicEvents.latestBar = createNewLatestBar(latestCandlestick);
              } else {
                if (!periodicEvents.latestBar) {
                  throw new Error("This should never happen.");
                }
              }
              // Update the latest bar with the incoming swap events.
              events.swapEvents.forEach((swap) => {
                updateLatestBar({ state, swap });
              });
            } else {
              // Otherwise, initialize a new bar.
              // If no swap events exist, we initialize a new bar from the latest candlestick.
              if (market.swapEvents.length !== 0) {
                periodicEvents.latestBar = createLatestBarFromSwaps(market.swapEvents, resolution);
              }
            }
            */

            // Now call the callback with the latest bar if the callback exists and if the latest
            // bar exists. The latest bar will only not exist if this function was called without
            // any swap or periodic state events.
            const periodicEvents = market[resolution]!;
            const { callback } = periodicEvents;
            if (periodicEvents.latestBar && callback) {
              callback(periodicEvents.latestBar);
              console.log("Updating latest bar from pushEvents.");
              console.debug("resolution", resolution);
              console.debug("latest bar", periodicEvents.latestBar);
            }
          });
        });

        // if (events.length === 0) return;
        // set((state) => {
        //   events.forEach((event) => {
        //     if (state.guids.has(event.guid)) return;
        //     state.firehose.push(event);
        //     state.guids.add(event.guid);
        //     if (isGlobalStateEvent(event)) return;
        //     const marketID = event.marketID.toString();
        //     if (!state.markets.has(marketID)) initializeMarketHelper(state, marketID);
        //     const market = state.markets.get(marketID)!;
        //     if (isSwapEvent(event)) {
        //       market.swapEvents.push(event);
        //       // console.log(market.swapEvents);
        //       console.log(state.getMarket(marketID)!.swapEvents);
        //       updateLatestBar({ state, swap: event });
        //     } else if (isStateEvent(event)) {
        //       market.stateEvents.push(event);
        //     } else if (isChatEvent(event)) {
        //       market.chatEvents.push(event);
        //     } else if (isLiquidityEvent(event)) {
        //       market.liquidityEvents.push(event);
        //     } else if (isMarketRegistrationEvent(event)) {
        //       state.marketRegistrationEvents.push(event);
        //     } else if (isPeriodicStateEvent(event)) {
        //       const period = Number(event.periodicStateMetadata.period);
        //       const resolution = toCandlestickResolution[period];
        //       if (!market[resolution]) {
        //         market[resolution] = createInitialCandlestickData();
        //       }
        //       market[resolution]!.events.push(event);
        //       const { callback } = market[resolution]!;
        //       if (callback) {
        //         const bar = toBar(event);
        //         console.debug(
        //           `[OSSIFYING LATEST BAR]: marketID: ${marketID}`,
        //           `bar: ${bar}`,
        //           `resolution: ${resolution}`
        //         );
        //         // Update the latest bar one last time with the incoming periodic state event.
        //         callback(bar);
        //         // Ossify/finalize the bar, i.e., make it immutable, by creating a new latest bar.
        //         createNewLatestBar(event);
        //       }
        //     }
        //   });
        // });
      },
      // We generally push WebSocket events one at a time.
      // Note that we `unshift` here because we add the latest event to the front of the array.
      pushEventFromWebSocket: (buffer) => {
        try {
          const json = JSON.parse(buffer.toString()) as DBJsonData<AnyEmojicoinJSONEvent>;
          if (!json) return;
          const data = deserializeEvent(json, json.transaction_version);
          if (!data) return;
          if (get().guids.has(data.event.guid)) return;
          set((state) => {
            state.firehose.unshift(data.event);
            state.guids.add(data.event.guid);
            if (isGlobalStateEventFromDB(json)) return;
            if (!data.marketID) throw new Error("No market ID found in event.");
            if (!state.markets.has(data.marketID)) initializeMarketHelper(state, data.marketID);
            const market = state.markets.get(data.marketID)!;
            if (isSwapEventFromDB(json)) {
              const swap = data.event as Types.SwapEvent;
              market.swapEvents.unshift(swap);
              // console.log("received swap event");
              // console.log(Array.from(market.swapEvents).map((v) => ({ ...v })));
              // updateLatestBarOld({ state, swap });
              const resolutions = RESOLUTIONS_ARRAY;
              resolutions.slice(0, 1).forEach((resolution) => {
                // console.log("/".repeat(50));
                // console.log(toResolutionKey(resolution));
                // console.log(Array.from(market[resolution]?.events.map((e) => ({ ...e })) ?? []));
                // console.log("time:", market[resolution]?.latestBar?.time);
                // console.log("periodBoundary:", market[resolution]?.latestBar?.periodBoundary);
                // // console.log(market[resolution]?.latestBar?.periodBoundary)
                // console.log("open:", market[resolution]?.latestBar?.open);
                // console.log("close:", market[resolution]?.latestBar?.close);
                // console.log("high:", market[resolution]?.latestBar?.high);
                // console.log("low:", market[resolution]?.latestBar?.low);
                // console.log("volume:", market[resolution]?.latestBar?.volume);
                // console.log(Array.from(market[resolution]?.latestBar?.guids.keys() ?? []));
                // console.log(market[resolution]?.callback);
                // console.log("=".repeat(50));
                // market[resolution]!.callback!(market[resolution]!.latestBar!);
              });
            } else if (isStateEventFromDB(json)) {
              market.stateEvents.unshift(data.event as Types.StateEvent);
            } else if (isChatEventFromDB(json)) {
              market.chatEvents.unshift(data.event as Types.ChatEvent);
            } else if (isLiquidityEventFromDB(json)) {
              market.liquidityEvents.unshift(data.event as Types.LiquidityEvent);
            } else if (isMarketRegistrationEventFromDB(json)) {
              state.marketRegistrationEvents.unshift(data.event as Types.MarketRegistrationEvent);
            } else if (isPeriodicStateEventFromDB(json)) {
              const event = data.event as Types.PeriodicStateEvent;
              const period = Number(event.periodicStateMetadata.period);
              const resolution = toCandlestickResolution[period];
              if (!market[resolution]) {
                market[resolution] = createInitialCandlestickData();
              }
              market[resolution]!.events.unshift(event);
              const { callback } = market[resolution]!;
              if (callback) {
                const bar = toBar(event);
                console.debug(
                  `[WSS]: marketID: ${data.marketID}`,
                  `bar: ${bar}`,
                  `resolution: ${resolution}`
                );
                // Update the latest bar one last time with the incoming periodic state event.
                callback(bar);
                // Ossify/finalize the bar, i.e., make it immutable, by creating a new latest bar.
                createNewLatestBar(event);
              }
            }
          });
        } catch (e) {
          console.error(e);
        }
      },
      initializeMarketMetadata: (markets) => {
        set((state) => {
          const entries = markets.map((m) => [m.marketID, m] as const);
          state.marketMetadataMap = new Map(entries);
          const newMarketMetadataMap = new Map<string, DetailedMarketMetadata>();
          const newSymbolToMarketIDMap = new Map<string, string>();
          markets.forEach((mkt) => {
            const { marketID, symbol } = mkt;
            newMarketMetadataMap.set(marketID, mkt);
            newSymbolToMarketIDMap.set(symbol, marketID);
          });
          state.marketMetadataMap = newMarketMetadataMap;
          state.symbols = newSymbolToMarketIDMap;
        });
      },
      getMarketMetadata: (marketID) => {
        return get().marketMetadataMap.get(marketID.toString());
      },
      subscribeToResolution: ({ symbol, resolution, cb }) => {
        console.log("SUBSCRIBE TO RESOLUTION");
        const marketID = get().symbols.get(symbol);
        if (!marketID) return;
        const marketForCheck = get().markets.get(marketID);
        if (!marketForCheck) return;
        set((state) => {
          const market = state.markets.get(marketID)!;
          if (!market[resolution]) {
            market[resolution] = createInitialCandlestickData();
          }
          const candlestickData = market[resolution]!;
          candlestickData.callback = cb;
          if (candlestickData.latestBar) {
            cb(candlestickData.latestBar);
            console.log("Updating latest bar from subscribeToResolution.");
            console.debug("resolution", resolution);
            console.debug("latest bar", candlestickData.latestBar);
          }
        });

        console.log("Subscribed to resolution", resolution, "for symbol", symbol);
      },
      unsubscribeFromResolution: ({ symbol, resolution }) => {
        const marketID = get().symbols.get(symbol);
        if (!marketID) return;
        const marketForCheck = get().markets.get(marketID);
        if (!marketForCheck) return;
        set((state) => {
          const market = state.markets.get(marketID)!;
          if (!market[resolution]) return;
          market[resolution]!.callback = undefined;
        });
      },
    }))
  );
};
