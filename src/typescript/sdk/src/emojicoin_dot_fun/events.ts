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
import { type PeriodDuration } from "../const";
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
        account_address: event.guid.account_address as `0x${string}`,
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
