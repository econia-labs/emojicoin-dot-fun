/* eslint-disable import/no-unused-modules */
import { type GUID, type EventJSON } from "../types/core";
import {
  type Types,
  type AnyEmojicoinEvent,
  toChatEvent,
  toGlobalStateEvent,
  toLiquidityEvent,
  toMarketRegistrationEvent,
  toPeriodicStateEvent,
  toStateEvent,
  toSwapEvent,
  isChatEvent,
  isGlobalStateEvent,
  isLiquidityEvent,
  isMarketRegistrationEvent,
  isPeriodicStateEvent,
  isStateEvent,
  isSwapEvent,
  type AnyHomogenousEvent,
} from "../types";
import { TYPE_TAGS } from "../utils/type-tags";
import { type AnyEmojicoinJSONEvent } from "../types/json-types";
import { CandlestickResolution, EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "../const";
import {
  type GroupedPeriodicStateEvents,
  createEmptyGroupedCandlesticks,
  isGroupedCandlesticks,
} from "../queries/client-utils/candlestick";

export type Events = {
  swapEvents: Types.SwapEvent[];
  chatEvents: Types.ChatEvent[];
  marketRegistrationEvents: Types.MarketRegistrationEvent[];
  periodicStateEvents: Types.PeriodicStateEvent[];
  stateEvents: Types.StateEvent[];
  globalStateEvents: Types.GlobalStateEvent[];
  liquidityEvents: Types.LiquidityEvent[];
  genericEvents: AptosEvent[];
};

export type ContractEvents = Omit<Events, "genericEvents">;
export type HomogenousEventStructure = Omit<
  ContractEvents,
  "periodicStateEvents" | "globalStateEvents" | "marketRegistrationEvents"
> & {
  // A flag for type checking purposes, to ensure we've run the events
  // through `toHomogenousEvents`.
  candlesticks: GroupedPeriodicStateEvents;
  homogenous: true;
  guids: Set<string>;
  marketID: bigint;
};

export const createEmptyEvents = (): Events => ({
  swapEvents: [],
  chatEvents: [],
  marketRegistrationEvents: [],
  periodicStateEvents: [],
  stateEvents: [],
  globalStateEvents: [],
  liquidityEvents: [],
  genericEvents: [],
});

export const createEmptyHomogenousEvents = (): HomogenousEventStructure => ({
  swapEvents: [],
  chatEvents: [],
  stateEvents: [],
  liquidityEvents: [],
  candlesticks: createEmptyGroupedCandlesticks(),
  homogenous: true as const,
  guids: new Set<string>(),
  marketID: -1n,
});

/**
 * Converts an array of any emojicoin event to a homogenous structure of events, where each event
 * is placed into its respective category.
 *
 * If `guids` is passed, only events with guids that aren't in the set will be included in the
 * final result.
 *
 * It throws an error if the marketID is not the same for all events that have one.
 *
 * It also throws if any events are a GlobalStateEvent.
 * @param anyEventArray array of any emojicoin events
 * @param guidsForFiltering existing guids to filter out
 * @returns ContractEvents a homogenous structure of events
 */
export const toHomogenousEvents = (
  anyEventArray: AnyHomogenousEvent[],
  guids: Set<string>
): HomogenousEventStructure | undefined => {
  const events = createEmptyHomogenousEvents();
  const marketIDs = new Set<bigint>();

  anyEventArray.forEach((event) => {
    if (!guids.has(event.guid)) {
      events.guids.add(event.guid);
      if (isGlobalStateEvent(event) || isMarketRegistrationEvent(event)) {
        throw new Error("GlobalStateEvent is not allowed as an input.");
      } else {
        marketIDs.add(event.marketID);
        if (isSwapEvent(event)) {
          events.swapEvents.push(event);
        } else if (isStateEvent(event)) {
          events.stateEvents.push(event);
        } else if (isChatEvent(event)) {
          events.chatEvents.push(event);
        } else if (isLiquidityEvent(event)) {
          events.liquidityEvents.push(event);
        } else if (isPeriodicStateEvent(event)) {
          const periodInEvent = Number(event.periodicStateMetadata.period) as CandlestickResolution;
          events.candlesticks[periodInEvent].push(event);
        }
      }
    }
  });
  events.marketID = Array.from(marketIDs).at(0) ?? -1n;
  if (marketIDs.size > 1) {
    throw new Error("All events must have the same market ID." + marketIDs.toString());
  }
  if (events.marketID === -1n) {
    return undefined;
  }
  return events;
};

// TODO: Do we need this? Perhaps we could add a sorted check here as well.
export const isHomogenous = (events: any): events is HomogenousEventStructure =>
  events.homogenous === true &&
  events.guids instanceof Set &&
  Array.isArray(events.swapEvents) &&
  Array.isArray(events.chatEvents) &&
  Array.isArray(events.stateEvents) &&
  Array.isArray(events.liquidityEvents) &&
  isGroupedCandlesticks(events.candlesticks);

export const converter: Map<
  string,
  (data: AnyEmojicoinJSONEvent, version: number) => AnyEmojicoinEvent
> = new Map();
[
  [TYPE_TAGS.SwapEvent, toSwapEvent] as const,
  [TYPE_TAGS.ChatEvent, toChatEvent] as const,
  [TYPE_TAGS.MarketRegistrationEvent, toMarketRegistrationEvent] as const,
  [TYPE_TAGS.PeriodicStateEvent, toPeriodicStateEvent] as const,
  [TYPE_TAGS.StateEvent, toStateEvent] as const,
  [TYPE_TAGS.GlobalStateEvent, toGlobalStateEvent] as const,
  [TYPE_TAGS.LiquidityEvent, toLiquidityEvent] as const,
].forEach(([tag, fn]) => {
  converter.set(tag.toString(), (data: AnyEmojicoinJSONEvent, version: number) =>
    fn(data as any, version)
  );
});

export type AptosEvent = {
  guid?: GUID;
  sequence_number?: bigint;
  type: string;
  data: any;
};

const getPossibleGUIDAndSequenceNumber = (
  event: EventJSON
): {
  guid?: GUID;
  sequence_number?: bigint;
} => {
  const guid = event.guid
    ? {
        creation_number: BigInt(event.guid.creation_number),
        account_address: event.guid.account_address,
      }
    : undefined;
  /* eslint-disable-next-line @typescript-eslint/naming-convention */
  const sequence_number = event.sequence_number ? BigInt(event.sequence_number) : undefined;
  const res = {
    guid,
    sequence_number,
  };
  if (typeof guid === "undefined") {
    delete res.guid;
  }
  if (typeof sequence_number === "undefined") {
    delete res.sequence_number;
  }
  return res;
};

export const toGenericEvent = (event: EventJSON): AptosEvent => ({
  ...getPossibleGUIDAndSequenceNumber(event),
  type: event.type,
  data: event.data,
});
