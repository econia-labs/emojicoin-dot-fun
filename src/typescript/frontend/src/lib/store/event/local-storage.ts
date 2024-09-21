import {
  type TableModels,
  type AnyEventModel,
  type MarketLatestStateEventModel,
  type MarketRegistrationEventModel,
  type GlobalStateEventModel,
} from "@sdk/indexer-v2/types";
import { type TableName } from "@sdk/indexer-v2/types/snake-case-types";
import { LOCALSTORAGE_EXPIRY_TIME_MS } from "const";
import { parseJSON, stringifyJSON } from "utils";
import { type MarketEventStore, type EventState, type SymbolString } from "./types";
import { createInitialMarketState } from "./utils";
import { type DeepWritable } from "@sdk/utils/utility-types";

const shouldKeepItem = (event: AnyEventModel) => {
  const eventTime = Number(event.transaction.timestamp);
  const now = new Date().getTime();
  return eventTime > now - LOCALSTORAGE_EXPIRY_TIME_MS;
};

export const addToLocalStorage = <T extends AnyEventModel>(event: T) => {
  const { eventName } = event;
  const events = localStorage.getItem(eventName) ?? "[]";
  const filtered: Array<T> = parseJSON(events).filter(shouldKeepItem);
  filtered.push(event);
  localStorage.setItem(eventName, stringifyJSON(filtered));
};

type EventArraysByModelType = {
  Swap: Array<TableModels[TableName.SwapEvents]>;
  Chat: Array<TableModels[TableName.ChatEvents]>;
  MarketRegistration: Array<TableModels[TableName.MarketRegistrationEvents]>;
  PeriodicState: Array<TableModels[TableName.PeriodicStateEvents]>;
  State: Array<TableModels[TableName.MarketLatestStateEvent]>;
  GlobalState: Array<TableModels[TableName.GlobalStateEvents]>;
  Liquidity: Array<TableModels[TableName.LiquidityEvents]>;
};

const emptyEventArraysByModelType: () => EventArraysByModelType = () => ({
  Swap: [] as EventArraysByModelType["Swap"],
  Chat: [] as EventArraysByModelType["Chat"],
  MarketRegistration: [] as EventArraysByModelType["MarketRegistration"],
  PeriodicState: [] as EventArraysByModelType["PeriodicState"],
  State: [] as EventArraysByModelType["State"],
  GlobalState: [] as EventArraysByModelType["GlobalState"],
  Liquidity: [] as EventArraysByModelType["Liquidity"],
});

type MarketEventTypes =
  | TableModels["swap_events"]
  | TableModels["chat_events"]
  | MarketLatestStateEventModel
  | TableModels["liquidity_events"]
  | TableModels["periodic_state_events"];

export const initialStateFromLocalStorage = (): EventState => {
  // Purge stale events then load up the remaining ones.
  const events = getEventsFromLocalStorage();

  // Sort each event that has a market by its market.
  const markets: Map<SymbolString, DeepWritable<MarketEventStore>> = new Map();
  const guids: Set<AnyEventModel["guid"]> = new Set();

  const addGuidAndGetMarket = (event: MarketEventTypes) => {
    // Before ensuring the market is initialized, add the incoming event to the set of guids.
    guids.add(event.guid);

    const { market } = event;
    const symbol = market.symbolData.symbol;
    if (!markets.has(symbol)) {
      markets.set(symbol, createInitialMarketState(market));
    }
    return markets.get(symbol)!;
  };

  const marketRegistrations: MarketRegistrationEventModel[] = [];
  const globalStateEvents: GlobalStateEventModel[] = [];

  events.Chat.forEach((e) => {
    addGuidAndGetMarket(e).chatEvents.push(e);
  });
  events.Liquidity.forEach((e) => {
    addGuidAndGetMarket(e).liquidityEvents.push(e);
  });
  events.State.forEach((e) => {
    addGuidAndGetMarket(e).stateEvents.push(e);
  });
  events.Swap.forEach((e) => {
    addGuidAndGetMarket(e).swapEvents.push(e);
  });
  events.PeriodicState.forEach((e) => {
    addGuidAndGetMarket(e)[e.periodicMetadata.period].candlesticks.push(e);
  });
  events.MarketRegistration.forEach((e) => {
    marketRegistrations.push(e);
    guids.add(e.guid);
  });
  events.GlobalState.forEach((e) => {
    globalStateEvents.push(e);
    guids.add(e.guid);
  });

  const stateFirehose: MarketLatestStateEventModel[] = [];

  for (const { stateEvents } of markets.values()) {
    stateFirehose.push(...(stateEvents as Array<MarketLatestStateEventModel>));
  }

  // Sort the state firehose by bump time, then market ID, then market nonce.
  stateFirehose.sort(({ market: a }, { market: b }) => {
    if (a.time === b.time) {
      if (a.marketID === b.marketID) {
        if (a.marketNonce === b.marketNonce) return 0;
        if (a.marketNonce < b.marketNonce) return 1;
        return -1;
      } else if (a.marketID < b.marketID) {
        return 1;
      }
      return -1;
    } else if (a.time < b.time) {
      return -1;
    }
    return 1;
  });

  return {
    guids,
    stateFirehose,
    marketRegistrations,
    markets: markets as unknown as Map<SymbolString, MarketEventStore>,
    globalStateEvents,
  };
};

/**
 * Purges old local storage events and returns any that remain.
 */
export const getEventsFromLocalStorage = () => {
  const res = emptyEventArraysByModelType();

  // Filter the events in local storage, then return them.
  Object.entries(res).forEach((entry) => {
    const eventName = entry[0] as keyof EventArraysByModelType;
    const events = entry[1] as EventArraysByModelType[typeof eventName];
    const existing = localStorage.getItem(eventName) ?? "[]";
    const filtered = parseJSON(existing).filter(shouldKeepItem);
    events.push(...filtered);
    localStorage.setItem(eventName, stringifyJSON(filtered));
  });

  return res;
};
