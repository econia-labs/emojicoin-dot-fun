/* eslint-disable import/no-unused-modules */
import { type GUID, type EventJSON } from "../types/core";
import {
  type ContractTypes,
  type EventTypes,
  toChatEvent,
  toGlobalStateEvent,
  toLiquidityEvent,
  toMarketRegistrationEvent,
  toPeriodicStateEvent,
  toStateEvent,
  toSwapEvent,
} from "../types/contract-types";
import { TYPE_TAGS } from "../utils/type-tags";
import { type JSONEventTypes } from "../types/json-types";

export type Events = {
  swapEvents: ContractTypes.SwapEvent[];
  chatEvents: ContractTypes.ChatEvent[];
  marketRegistrationEvents: ContractTypes.MarketRegistrationEvent[];
  periodicStateEvents: ContractTypes.PeriodicStateEvent[];
  stateEvents: ContractTypes.StateEvent[];
  globalStateEvents: ContractTypes.GlobalStateEvent[];
  liquidityEvents: ContractTypes.LiquidityEvent[];
  events: AptosEvent[];
};

export const converter: Map<string, (data: JSONEventTypes) => EventTypes> = new Map();
[
  [TYPE_TAGS.SwapEvent, toSwapEvent] as const,
  [TYPE_TAGS.ChatEvent, toChatEvent] as const,
  [TYPE_TAGS.MarketRegistrationEvent, toMarketRegistrationEvent] as const,
  [TYPE_TAGS.PeriodicStateEvent, toPeriodicStateEvent] as const,
  [TYPE_TAGS.StateEvent, toStateEvent] as const,
  [TYPE_TAGS.GlobalStateEvent, toGlobalStateEvent] as const,
  [TYPE_TAGS.LiquidityEvent, toLiquidityEvent] as const,
].forEach(([tag, fn]) => {
  converter.set(tag.toString(), (data: JSONEventTypes) => fn(data as any));
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

export const toEvent = (event: EventJSON): AptosEvent => {
  if (!converter.has(event.type)) {
    return toGenericEvent(event);
  }
  const conversionFunction = converter.get(event.type)!;
  const data = conversionFunction(event.data);
  return {
    ...getPossibleGUIDAndSequenceNumber(event),
    type: event.type,
    data,
  };
};
