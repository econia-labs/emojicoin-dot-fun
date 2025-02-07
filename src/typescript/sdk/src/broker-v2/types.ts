import { type BrokerEventModels, DatabaseTypeConverter } from "../indexer-v2/types";
import {
  type BrokerJsonTypes,
  type DatabaseJsonType,
  TableName,
} from "../indexer-v2/types/json-types";
import { type AnyNumberString } from "../types/types";

export type BrokerEvent = SubscribableBrokerEvents | BrokerArenaEvent;

export type SubscribableBrokerEvents =
  | "Chat"
  | "Swap"
  | "Liquidity"
  | "MarketLatestState"
  | "GlobalState"
  | "PeriodicState"
  | "MarketRegistration";

type BrokerArenaEvent =
  | "ArenaEnter"
  | "ArenaExit"
  | "ArenaMelee"
  | "ArenaSwap"
  | "ArenaVaultBalanceUpdate";

const Chat = TableName.ChatEvents;
const Swap = TableName.SwapEvents;
const Liquidity = TableName.LiquidityEvents;
const MarketLatestState = TableName.MarketLatestStateEvent;
const GlobalState = TableName.GlobalStateEvents;
const PeriodicState = TableName.PeriodicStateEvents;
const MarketRegistration = TableName.MarketRegistrationEvents;
const ArenaEnter = TableName.ArenaEnterEvents;
const ArenaExit = TableName.ArenaExitEvents;
const ArenaMelee = TableName.ArenaMeleeEvents;
const ArenaSwap = TableName.ArenaSwapEvents;
const ArenaVaultBalanceUpdate = TableName.ArenaVaultBalanceUpdateEvents;
type ChatType = DatabaseJsonType[typeof Chat];
type SwapType = DatabaseJsonType[typeof Swap];
type LiquidityType = DatabaseJsonType[typeof Liquidity];
type MarketLatestStateType = DatabaseJsonType[typeof MarketLatestState];
type GlobalStateType = DatabaseJsonType[typeof GlobalState];
type PeriodicStateType = DatabaseJsonType[typeof PeriodicState];
type MarketRegistrationType = DatabaseJsonType[typeof MarketRegistration];
type ArenaEnterType = DatabaseJsonType[typeof ArenaEnter];
type ArenaExitType = DatabaseJsonType[typeof ArenaExit];
type ArenaMeleeType = DatabaseJsonType[typeof ArenaMelee];
type ArenaSwapType = DatabaseJsonType[typeof ArenaSwap];
type ArenaVaultBalanceUpdateType = DatabaseJsonType[typeof ArenaVaultBalanceUpdate];

export const brokerMessageConverter: Record<BrokerEvent, (data: unknown) => BrokerEventModels> = {
  Chat: (d) => DatabaseTypeConverter[Chat](d as ChatType),
  Swap: (d) => DatabaseTypeConverter[Swap](d as SwapType),
  Liquidity: (d) => DatabaseTypeConverter[Liquidity](d as LiquidityType),
  MarketLatestState: (d) => DatabaseTypeConverter[MarketLatestState](d as MarketLatestStateType),
  GlobalState: (d) => DatabaseTypeConverter[GlobalState](d as GlobalStateType),
  PeriodicState: (d) => DatabaseTypeConverter[PeriodicState](d as PeriodicStateType),
  MarketRegistration: (d) => DatabaseTypeConverter[MarketRegistration](d as MarketRegistrationType),
  ArenaEnter: (d) => DatabaseTypeConverter[ArenaEnter](d as ArenaEnterType),
  ArenaExit: (d) => DatabaseTypeConverter[ArenaExit](d as ArenaExitType),
  ArenaMelee: (d) => DatabaseTypeConverter[ArenaMelee](d as ArenaMeleeType),
  ArenaSwap: (d) => DatabaseTypeConverter[ArenaSwap](d as ArenaSwapType),
  ArenaVaultBalanceUpdate: (d) =>
    DatabaseTypeConverter[ArenaVaultBalanceUpdate](d as ArenaVaultBalanceUpdateType),
};

/**
 * Note that this is primarily here to indicate the structure of the message.
 */
export type BrokerMessage = {
  [K in BrokerEvent]: BrokerJsonTypes;
};

/**
 * The message the client sends to the broker to subscribe or unsubscribe.
 */
export type SubscriptionMessage = {
  markets: number[];
  event_types: BrokerEvent[];
  arena: boolean;
};

/* eslint-disable-next-line import/no-unused-modules */
export type WebSocketSubscriptions = {
  marketIDs: Set<AnyNumberString>;
  eventTypes: Set<BrokerEvent>;
  arena: boolean;
};
