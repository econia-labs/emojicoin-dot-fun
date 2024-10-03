/* eslint-disable import/no-unused-modules */
import { type GUID, type EventJSON } from "../types/core";
import {
  type JsonTypes,
  type Types,
  toChatEvent,
  toGlobalStateEvent,
  toLiquidityEvent,
  toMarketRegistrationEvent,
  toPeriodicStateEvent,
  toStateEvent,
  toSwapEvent,
  toMarketResource,
  toRegistryResource,
  toRegistrantGracePeriodFlag,
  toEmojicoinDotFunRewards,
} from "../types";
import { type EmojicoinStructName } from "../utils/type-tags";

export type FullEventNames =
  | "ChatEvent"
  | "SwapEvent"
  | "MarketRegistrationEvent"
  | "PeriodicStateEvent"
  | "StateEvent"
  | "GlobalStateEvent"
  | "LiquidityEvent";

type RemovePlurality<T extends string> = T extends `${infer R}s` ? R : T;
type PascalToCamelCase<S extends string> = S extends `${infer F}${infer R}`
  ? `${Lowercase<F>}${R}`
  : S;
type CamelCaseEventNames = `${PascalToCamelCase<FullEventNames>}s`;
type Capitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S;

export const toCamelCaseEventName = <T extends FullEventNames>(s: T): PascalToCamelCase<T> => {
  return `${s.charAt(0).toLowerCase()}${s.slice(1)}` as PascalToCamelCase<T>;
};

export type Events = { [K in CamelCaseEventNames]: Types[Capitalize<RemovePlurality<K>>][] };

export const createEmptyEvents = (): Events => ({
  swapEvents: [],
  chatEvents: [],
  marketRegistrationEvents: [],
  periodicStateEvents: [],
  stateEvents: [],
  globalStateEvents: [],
  liquidityEvents: [],
});

type Converter = {
  [K in EmojicoinStructName]: (data: JsonTypes[K], version: number | string) => Types[K];
};

export const converter: Converter = {
  ["SwapEvent"]: toSwapEvent,
  ["ChatEvent"]: toChatEvent,
  ["MarketRegistrationEvent"]: toMarketRegistrationEvent,
  ["PeriodicStateEvent"]: toPeriodicStateEvent,
  ["StateEvent"]: toStateEvent,
  ["GlobalStateEvent"]: toGlobalStateEvent,
  ["LiquidityEvent"]: toLiquidityEvent,
  ["Market"]: toMarketResource,
  ["Registry"]: toRegistryResource,
  ["RegistrantGracePeriodFlag"]: toRegistrantGracePeriodFlag,
  ["EmojicoinDotFunRewards"]: toEmojicoinDotFunRewards,
};

export type AptosEvent = {
  guid?: GUID;
  sequence_number?: bigint;
  type: string;
  data: unknown;
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

const _toGenericEvent = (event: EventJSON): AptosEvent => ({
  ...getPossibleGUIDAndSequenceNumber(event),
  type: event.type,
  data: event.data,
});
