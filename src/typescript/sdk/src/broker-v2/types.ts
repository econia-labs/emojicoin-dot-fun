import { type AnyPeriod, ArenaPeriod } from "../const";
import {
  type BrokerEventModels,
  DatabaseTypeConverter,
  type PeriodTypeFromBroker,
} from "../indexer-v2/types";
import {
  type BrokerJsonTypes,
  type DatabaseJsonType,
  TableName,
} from "../indexer-v2/types/json-types";
import type { ARENA_CANDLESTICK_NAME } from "../types/arena-types";
import type { AnyNumberString, CANDLESTICK_NAME } from "../types/types";

export type BrokerEvent = SubscribableBrokerEvents | BrokerArenaEvent;

export type SubscribableBrokerEvents =
  | "Chat"
  | "Swap"
  | "Liquidity"
  | "MarketLatestState"
  | "GlobalState"
  | "PeriodicState"
  | "MarketRegistration"
  | typeof CANDLESTICK_NAME;

export type BrokerArenaEvent =
  | "ArenaEnter"
  | "ArenaExit"
  | "ArenaMelee"
  | "ArenaSwap"
  | "ArenaVaultBalanceUpdate"
  | typeof ARENA_CANDLESTICK_NAME;

const Chat = TableName.ChatEvents;
const Swap = TableName.SwapEvents;
const Liquidity = TableName.LiquidityEvents;
const MarketLatestState = TableName.MarketLatestStateEvent;
const GlobalState = TableName.GlobalStateEvents;
const PeriodicState = TableName.PeriodicStateEvents;
const MarketRegistration = TableName.MarketRegistrationEvents;
const Candlestick = TableName.Candlesticks;
const ArenaEnter = TableName.ArenaEnterEvents;
const ArenaExit = TableName.ArenaExitEvents;
const ArenaMelee = TableName.ArenaMeleeEvents;
const ArenaSwap = TableName.ArenaSwapEvents;
const ArenaVaultBalanceUpdate = TableName.ArenaVaultBalanceUpdateEvents;
const ArenaCandlestick = TableName.ArenaCandlesticks;
type ChatType = DatabaseJsonType[typeof Chat];
type SwapType = DatabaseJsonType[typeof Swap];
type LiquidityType = DatabaseJsonType[typeof Liquidity];
type MarketLatestStateType = DatabaseJsonType[typeof MarketLatestState];
type GlobalStateType = DatabaseJsonType[typeof GlobalState];
type PeriodicStateType = DatabaseJsonType[typeof PeriodicState];
type MarketRegistrationType = DatabaseJsonType[typeof MarketRegistration];
type CandlestickType = DatabaseJsonType[typeof Candlestick];
type ArenaEnterType = DatabaseJsonType[typeof ArenaEnter];
type ArenaExitType = DatabaseJsonType[typeof ArenaExit];
type ArenaMeleeType = DatabaseJsonType[typeof ArenaMelee];
type ArenaSwapType = DatabaseJsonType[typeof ArenaSwap];
type ArenaVaultBalanceUpdateType = DatabaseJsonType[typeof ArenaVaultBalanceUpdate];
type ArenaCandlestickType = DatabaseJsonType[typeof ArenaCandlestick];

export const brokerMessageConverter: Record<BrokerEvent, (data: unknown) => BrokerEventModels> = {
  Chat: (d) => DatabaseTypeConverter[Chat](d as ChatType),
  Swap: (d) => DatabaseTypeConverter[Swap](d as SwapType),
  Liquidity: (d) => DatabaseTypeConverter[Liquidity](d as LiquidityType),
  MarketLatestState: (d) => DatabaseTypeConverter[MarketLatestState](d as MarketLatestStateType),
  GlobalState: (d) => DatabaseTypeConverter[GlobalState](d as GlobalStateType),
  PeriodicState: (d) => DatabaseTypeConverter[PeriodicState](d as PeriodicStateType),
  MarketRegistration: (d) => DatabaseTypeConverter[MarketRegistration](d as MarketRegistrationType),
  Candlestick: (d) => DatabaseTypeConverter[Candlestick](d as CandlestickType),
  ArenaEnter: (d) => DatabaseTypeConverter[ArenaEnter](d as ArenaEnterType),
  ArenaExit: (d) => DatabaseTypeConverter[ArenaExit](d as ArenaExitType),
  ArenaMelee: (d) => DatabaseTypeConverter[ArenaMelee](d as ArenaMeleeType),
  ArenaSwap: (d) => DatabaseTypeConverter[ArenaSwap](d as ArenaSwapType),
  ArenaVaultBalanceUpdate: (d) =>
    DatabaseTypeConverter[ArenaVaultBalanceUpdate](d as ArenaVaultBalanceUpdateType),
  ArenaCandlestick: (d) => DatabaseTypeConverter[ArenaCandlestick](d as ArenaCandlestickType),
};

/**
 * Note that this is primarily here to indicate the structure of the message.
 */
export type BrokerMessage = {
  [K in BrokerEvent]: BrokerJsonTypes;
};

/**
 * Arena periods are subscribed in a granular way- like an actual sub/pub model with topics.
 */
export type ArenaPeriodRequest = {
  action: "subscribe" | "unsubscribe";
  period: PeriodTypeFromBroker;
};

/**
 * The message the client sends to the broker to subscribe or unsubscribe.
 */
export type SubscriptionMessage = {
  markets: number[];
  event_types: BrokerEvent[];
  arena: boolean;
  arena_period?: ArenaPeriodRequest;
};

/* eslint-disable-next-line import/no-unused-modules */
export type WebSocketSubscriptions = {
  marketIDs: Set<AnyNumberString>;
  eventTypes: Set<BrokerEvent>;
  arena: boolean;
  arenaPeriods: Set<PeriodTypeFromBroker>;
};

const PeriodToBrokerPeriodType: Record<AnyPeriod, PeriodTypeFromBroker> = {
  [ArenaPeriod.Period15S]: "FifteenSeconds",
  [ArenaPeriod.Period1M]: "OneMinute",
  [ArenaPeriod.Period5M]: "FiveMinutes",
  [ArenaPeriod.Period15M]: "FifteenMinutes",
  [ArenaPeriod.Period30M]: "ThirtyMinutes",
  [ArenaPeriod.Period1H]: "OneHour",
  [ArenaPeriod.Period4H]: "FourHours",
  [ArenaPeriod.Period1D]: "OneDay",
};

export const periodToPeriodTypeFromBroker = (period: AnyPeriod) => PeriodToBrokerPeriodType[period];
