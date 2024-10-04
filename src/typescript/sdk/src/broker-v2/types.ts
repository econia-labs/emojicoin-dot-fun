import { type AnyEventModel, DatabaseTypeConverter } from "../indexer-v2/types";
import {
  type AnyEventDatabaseRow,
  type DatabaseJsonType,
  TableName,
} from "../indexer-v2/types/json-types";
import { type AnyNumberString } from "../types/types";

export type EventModelName =
  | "Chat"
  | "Swap"
  | "Liquidity"
  | "MarketLatestState"
  | "GlobalState"
  | "PeriodicState"
  | "MarketRegistration";

const Chat = TableName.ChatEvents;
const Swap = TableName.SwapEvents;
const Liquidity = TableName.LiquidityEvents;
const MarketLatestState = TableName.MarketLatestStateEvent;
const GlobalState = TableName.GlobalStateEvents;
const PeriodicState = TableName.PeriodicStateEvents;
const MarketRegistration = TableName.MarketRegistrationEvents;
type ChatType = DatabaseJsonType[typeof Chat];
type SwapType = DatabaseJsonType[typeof Swap];
type LiquidityType = DatabaseJsonType[typeof Liquidity];
type MarketLatestStateType = DatabaseJsonType[typeof MarketLatestState];
type GlobalStateType = DatabaseJsonType[typeof GlobalState];
type PeriodicStateType = DatabaseJsonType[typeof PeriodicState];
type MarketRegistrationType = DatabaseJsonType[typeof MarketRegistration];

export const brokerMessageConverter: Record<EventModelName, (data: unknown) => AnyEventModel> = {
  Chat: (d) => DatabaseTypeConverter[Chat](d as ChatType),
  Swap: (d) => DatabaseTypeConverter[Swap](d as SwapType),
  Liquidity: (d) => DatabaseTypeConverter[Liquidity](d as LiquidityType),
  MarketLatestState: (d) => DatabaseTypeConverter[MarketLatestState](d as MarketLatestStateType),
  GlobalState: (d) => DatabaseTypeConverter[GlobalState](d as GlobalStateType),
  PeriodicState: (d) => DatabaseTypeConverter[PeriodicState](d as PeriodicStateType),
  MarketRegistration: (d) => DatabaseTypeConverter[MarketRegistration](d as MarketRegistrationType),
};

/**
 * Note that this is primarily here to indicate the structure of the message.
 *
 * Due to the nature of `json-bigint` and how we default to parsing everything as a bigint,
 * technically the types for `AnyEventModel` will differ from the actual message that's parsed.
 *
 * This ultimately doesn't matter, because we process and convert each incoming message with the
 * corresponding `TableConverter` functions after parsing the initial JSON message.
 */
export type BrokerMessage = {
  [K in EventModelName]: AnyEventDatabaseRow;
};

/**
 * The message the client sends to the broker to subscribe or unsubscribe.
 */
export type SubscriptionMessage = {
  markets: number[];
  event_types: EventModelName[];
};

/* eslint-disable-next-line import/no-unused-modules */
export type WebSocketSubscriptions = {
  marketIDs: Set<AnyNumberString>;
  eventTypes: Set<EventModelName>;
};
