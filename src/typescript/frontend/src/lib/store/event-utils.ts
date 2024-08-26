import {
  type AnyEmojicoinEventName,
  toChatEvent,
  toGlobalStateEvent,
  toLiquidityEvent,
  toMarketRegistrationEvent,
  toPeriodicStateEvent,
  toStateEvent,
  toSwapEvent,
  type AnyEmojicoinEvent,
  type Types,
  getEmojicoinEventTime,
  getEventTypeName,
} from "@sdk/types/types";

import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import type JSONTypes from "@sdk/types/json-types";
import { type DBJsonData } from "@sdk/emojicoin_dot_fun/utils";
import { type AnyEmojicoinJSONEvent } from "@sdk/types/json-types";
import { MODULE_ADDRESS, RESOLUTIONS_ARRAY } from "@sdk/const";
import { type MarketStateValueType } from "./event-store";
import { parseJSON, stringifyJSON } from "utils";
import { LOCALSTORAGE_EXPIRY_TIME_MS } from "const";

export type AddEventsType<T> = ({ data, sorted }: { data: readonly T[]; sorted?: boolean }) => void;

// Type aliases for more specificity.
export type MarketIDString = string;
export type SymbolString = string;

if (MODULE_ADDRESS.toStringWithoutPrefix().startsWith("0")) {
  console.error("-".repeat(80) + "\n");
  console.error("Module address starts with zero. This will lead to indexing and parsing errors.");
  console.error("-".repeat(80) + "\n");
}

type AnyDBJsonEvent = DBJsonData<AnyEmojicoinJSONEvent>;

export type EventDeserializationFunction<
  T extends AnyEmojicoinJSONEvent,
  U extends AnyEmojicoinEvent,
> = (
  data: DBJsonData<T>,
  version: number
) => { event: U; marketID?: MarketIDString; symbol?: SymbolString };

export function deserializeEvent(
  data: AnyDBJsonEvent,
  version: number
): { event: AnyEmojicoinEvent; marketID?: undefined; symbol?: undefined } | undefined;
export function deserializeEvent(
  data: DBJsonData<JSONTypes.SwapEvent>,
  version: number
): { event: Types.SwapEvent; marketID: MarketIDString };
export function deserializeEvent(
  data: DBJsonData<JSONTypes.ChatEvent>,
  version: number
): { event: Types.ChatEvent; marketID: MarketIDString; symbol: SymbolString };
export function deserializeEvent(
  data: DBJsonData<JSONTypes.MarketRegistrationEvent>,
  version: number
): {
  event: Types.MarketRegistrationEvent;
  marketID: MarketIDString;
  symbol: SymbolString;
};
export function deserializeEvent(
  data: DBJsonData<JSONTypes.PeriodicStateEvent>,
  version: number
): {
  event: Types.PeriodicStateEvent;
  marketID: MarketIDString;
  symbol: SymbolString;
};
export function deserializeEvent(
  data: DBJsonData<JSONTypes.StateEvent>,
  version: number
): { event: Types.StateEvent; marketID: MarketIDString; symbol: SymbolString };
export function deserializeEvent(
  data: DBJsonData<JSONTypes.GlobalStateEvent>,
  version: number
): { event: Types.GlobalStateEvent; marketID: undefined; symbol: undefined };
export function deserializeEvent(
  data: DBJsonData<JSONTypes.LiquidityEvent>,
  version: number
): { event: Types.LiquidityEvent; marketID: MarketIDString };
export function deserializeEvent<T extends AnyEmojicoinJSONEvent, U extends AnyEmojicoinEvent>(
  data: DBJsonData<T>,
  version: number
) {
  const conversion = deserializationMap[data.event_name];
  if (!conversion) {
    console.warn(`No conversion function found for event type: ${data.event_name}`);
    return undefined;
  }
  return conversion(data, version) as ReturnType<EventDeserializationFunction<T, U>>;
}

export type WebSocketConversionFunction<
  T1 extends AnyEmojicoinJSONEvent,
  T2 extends AnyEmojicoinEvent,
> = (
  data: DBJsonData<T1>,
  version: number
) =>
  | {
      event: T2;
      marketID: MarketIDString;
      symbol: SymbolString;
    }
  | {
      event: T2;
      marketID: MarketIDString;
    }
  | {
      event: T2;
    };

export const deserializationMap: Record<
  AnyEmojicoinEventName,
  WebSocketConversionFunction<AnyEmojicoinJSONEvent, AnyEmojicoinEvent>
> = {
  ["emojicoin_dot_fun::Swap"]: (data, version) => {
    const json = data.data as JSONTypes.SwapEvent;
    const event = toSwapEvent(json, version);
    const marketID = event.marketID.toString();
    return {
      event,
      marketID,
    };
  },
  ["emojicoin_dot_fun::Chat"]: (data, version) => {
    const json = data.data as JSONTypes.ChatEvent;
    const event = toChatEvent(json, version);
    const marketID = event.marketMetadata.marketID.toString();
    return {
      event,
      marketID,
      symbol: symbolBytesToEmojis(event.marketMetadata.emojiBytes).symbol,
    };
  },
  ["emojicoin_dot_fun::MarketRegistration"]: (data, version) => {
    const json = data.data as JSONTypes.MarketRegistrationEvent;
    const event = toMarketRegistrationEvent(json, version);
    const marketID = event.marketMetadata.marketID.toString();
    return {
      event,
      marketID,
      symbol: symbolBytesToEmojis(event.marketMetadata.emojiBytes).symbol,
    };
  },
  ["emojicoin_dot_fun::PeriodicState"]: (data, version) => {
    const json = data.data as JSONTypes.PeriodicStateEvent;
    const event = toPeriodicStateEvent(json, version);
    const marketID = event.marketMetadata.marketID.toString();
    return {
      event,
      marketID,
      symbol: symbolBytesToEmojis(event.marketMetadata.emojiBytes).symbol,
    };
  },
  ["emojicoin_dot_fun::State"]: (data, version) => {
    const json = data.data as JSONTypes.StateEvent;
    const event = toStateEvent(json, version);
    const marketID = event.marketMetadata.marketID.toString();
    return {
      event,
      marketID,
      symbol: symbolBytesToEmojis(event.marketMetadata.emojiBytes).symbol,
    };
  },
  ["emojicoin_dot_fun::GlobalState"]: (data, version) => {
    const json = data.data as JSONTypes.GlobalStateEvent;
    const event = toGlobalStateEvent(json, version);
    return {
      event,
    };
  },
  ["emojicoin_dot_fun::Liquidity"]: (data, version) => {
    const json = data.data as JSONTypes.LiquidityEvent;
    const event = toLiquidityEvent(json, version);
    return {
      event,
      marketID: event.marketID.toString(),
    };
  },
};

export const getLatestBars = (market: MarketStateValueType) => {
  return RESOLUTIONS_ARRAY.map((res) => ({ ...market[res]!.latestBar, period: res }));
};

const shouldKeep = (event: AnyEmojicoinEvent) => {
  const eventTimeMs = Number(getEmojicoinEventTime(event) / 1000n);
  const now = new Date().getTime();
  return eventTimeMs > now - LOCALSTORAGE_EXPIRY_TIME_MS;
};

export const addToLocalStorage = (event: AnyEmojicoinEvent) => {
  const eventName = getEventTypeName(event);
  const localEvents: Array<AnyEmojicoinEvent> = parseJSON(localStorage.getItem(eventName) ?? "[]");

  localEvents.push(event);
  const filtered = localEvents.filter(shouldKeep);
  localStorage.setItem(eventName, stringifyJSON(filtered));
};

export const updateLocalStorage = (event: AnyEmojicoinEvent) => {
  const eventName = getEventTypeName(event);
  let localEvents: Array<AnyEmojicoinEvent> = parseJSON(localStorage.getItem(eventName) ?? "[]");

  localEvents = localEvents.filter((e) => e.guid != event.guid);

  localEvents.push(event);
  const filtered = localEvents.filter(shouldKeep);
  localStorage.setItem(eventName, stringifyJSON(filtered));
};
