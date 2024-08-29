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
import { type ContractPeriod } from "../const";
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
export type UniqueHomogenousEvents = Omit<
  ContractEvents,
  "periodicStateEvents" | "globalStateEvents" | "marketRegistrationEvents"
> & {
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

export const createEmptyHomogenousEvents = (): UniqueHomogenousEvents => ({
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
 * Converts an array of emojicoin events that fall under a single market ID to a homogenous
 * structure of event arrays, where each event is placed into its respective, typed category.
 *
 * If `guids` is passed, only events with guids that aren't in the set will be included in the
 * final result.
 *
 * It also sorts each periodic state event into its respective candlestick period array.
 *
 * It throws an error if the marketID is not the same for all events.
 *
 * It also throws if any events are a GlobalStateEvent or MarketRegistrationEvent, because they
 * should be pushed individually to the event store with their respective `EventStore` push
 * functions.
 *
 * @param anyEventArray array of any emojicoin events
 * @param guidsForFiltering existing guids to filter out
 * @returns `ContractEvents` a homogenous structure of events
 * @throws if the marketID is not the same for all events
 * @throws if any events are GlobalStateEvents or MarketRegistrationEvents
 */
export const toUniqueHomogenousEvents = (
  anyEventArray: AnyHomogenousEvent[],
  /**
   * **NOTE**: This value *must* be provided to avoid duplicating data in the event store.
   * @example
   * const getGuids = useEventStore((s) => s.getGuids);
   * const events = toHomogenousEvents(data, getGuids());
   */
  guids: Set<string>
): UniqueHomogenousEvents | undefined => {
  const events = createEmptyHomogenousEvents();
  const marketIDs = new Set<bigint>();

  anyEventArray.forEach((event) => {
    if (!guids.has(event.guid)) {
      events.guids.add(event.guid);
      if (isGlobalStateEvent(event) || isMarketRegistrationEvent(event)) {
        throw new Error(
          "GlobalStateEvents and MarketRegistrationEvents are not valid homogenous events." +
            "They should be pushed individually to the event store."
        );
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
          const periodInEvent = Number(event.periodicStateMetadata.period) as ContractPeriod;
          events.candlesticks[periodInEvent].push(event);
        }
      }
    }
  });
  events.marketID = Array.from(marketIDs).at(0) ?? -1n;
  if (marketIDs.size > 1) {
    throw new Error(`All events must have the same market ID.${marketIDs.toString()}`);
  }
  if (events.marketID === -1n) {
    return undefined;
  }
  return events;
};

// TODO: Do we need this? Perhaps we could add a sorted check here as well.
export const isHomogenous = (events: any): events is UniqueHomogenousEvents =>
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
