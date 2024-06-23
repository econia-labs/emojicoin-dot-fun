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
} from "@sdk/types/types";

import { symbolBytesToEmojis } from "@sdk/emoji_data/utils";
import type JSONTypes from "@sdk/types/json-types";
import { type DBJsonData } from "@sdk/emojicoin_dot_fun/utils";
import { type AnyEmojicoinJSONEvent } from "@sdk/types/json-types";
import { MODULE_ADDRESS, RESOLUTIONS_ARRAY } from "@sdk/const";
import { type MarketStateValueType } from "./event-store";

export type AddEventsType<T> = ({ data, sorted }: { data: readonly T[]; sorted?: boolean }) => void;

// Type aliases for more specificity.
export type MarketIDString = string;
export type SymbolString = string;

if (MODULE_ADDRESS.toStringWithoutPrefix().startsWith("0")) {
  console.error("-".repeat(80) + "\n");
  console.error("Module address starts with zero. This will lead to indexing and parsing errors.");
  console.error("-".repeat(80) + "\n");
}

export const mergeSortedEvents = <T extends AnyEmojicoinEvent>(
  existing: readonly T[],
  incoming: T[]
): T[] => {
  const merged: T[] = [];
  let i = 0;
  let j = 0;
  while (i < existing.length && j < incoming.length) {
    if (existing[i].version > incoming[j].version) {
      merged.push(existing[i]);
      i++;
    } else {
      merged.push(incoming[j]);
      j++;
    }
  }
  while (i < existing.length) {
    merged.push(existing[i]);
    i++;
  }
  while (j < incoming.length) {
    merged.push(incoming[j]);
    j++;
  }

  return merged;
};

type AnyDBJsonEvent = DBJsonData<AnyEmojicoinJSONEvent>;
type DBSwapEvent = DBJsonData<JSONTypes.SwapEvent>;
type DBChatEvent = DBJsonData<JSONTypes.ChatEvent>;
type DBMarketRegistrationEvent = DBJsonData<JSONTypes.MarketRegistrationEvent>;
type DBPeriodicStateEvent = DBJsonData<JSONTypes.PeriodicStateEvent>;
type DBStateEvent = DBJsonData<JSONTypes.StateEvent>;
type DBGlobalStateEvent = DBJsonData<JSONTypes.GlobalStateEvent>;
type DBLiquidityEvent = DBJsonData<JSONTypes.LiquidityEvent>;

export function isSwapEventFromDB(e: AnyDBJsonEvent): e is DBSwapEvent {
  return e.event_name === "emojicoin_dot_fun::Swap";
}
export function isChatEventFromDB(e: AnyDBJsonEvent): e is DBChatEvent {
  return e.event_name === "emojicoin_dot_fun::Chat";
}
export function isMarketRegistrationEventFromDB(e: AnyDBJsonEvent): e is DBMarketRegistrationEvent {
  return e.event_name === "emojicoin_dot_fun::MarketRegistration";
}
export function isPeriodicStateEventFromDB(e: AnyDBJsonEvent): e is DBPeriodicStateEvent {
  return e.event_name === "emojicoin_dot_fun::PeriodicState";
}
export function isStateEventFromDB(e: AnyDBJsonEvent): e is DBStateEvent {
  return e.event_name === "emojicoin_dot_fun::State";
}
export function isGlobalStateEventFromDB(e: AnyDBJsonEvent): e is DBGlobalStateEvent {
  return e.event_name === "emojicoin_dot_fun::GlobalState";
}
export function isLiquidityEventFromDB(e: AnyDBJsonEvent): e is DBLiquidityEvent {
  return e.event_name === "emojicoin_dot_fun::Liquidity";
}

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
