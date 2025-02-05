import { type Types, type JsonTypes, type AnyNumberString } from "../types";
import {
  toArenaEnterEvent,
  toArenaExitEvent,
  toArenaMeleeEvent,
  toArenaSwapEvent,
  toArenaVaultBalanceUpdateEvent,
} from "../types/arena-types";
import { type ArenaStructName } from "../utils/type-tags";
import { type RemovePlurality, type PascalToCamelCase } from "./events";

type FullArenaEventName = keyof typeof fullArenaEventNames;

const fullArenaEventNames = {
  ArenaMeleeEvent: null,
  ArenaEnterEvent: null,
  ArenaExitEvent: null,
  ArenaSwapEvent: null,
  ArenaVaultBalanceUpdateEvent: null,
};
type CamelCaseArenaEventNames = `${PascalToCamelCase<FullArenaEventName>}s`;

/* eslint-disable*/

const arenaEventNamesSet = new Set(Object.keys(fullArenaEventNames));
export const isAnArenaStructName = (s: string): s is FullArenaEventName =>
  arenaEventNamesSet.has(s);

export const toCamelCaseArenaEventName = <T extends FullArenaEventName>(
  s: T
): PascalToCamelCase<T> => {
  return `${s.charAt(0).toLowerCase()}${s.slice(1)}` as PascalToCamelCase<T>;
};

export type ArenaEvents = {
  [K in CamelCaseArenaEventNames]: Types[Capitalize<RemovePlurality<K>>][];
};

export type ArenaEventsWithIndices = {
  [K in keyof ArenaEvents]: (ArenaEvents[K][number] & { eventIndex: number })[];
};

export const createEmptyArenaEvents = (): ArenaEvents => ({
  arenaMeleeEvents: [],
  arenaEnterEvents: [],
  arenaExitEvents: [],
  arenaSwapEvents: [],
  arenaVaultBalanceUpdateEvents: [],
});

type ArenaConverter = {
  [K in ArenaStructName]: (
    data: JsonTypes[K],
    version: AnyNumberString,
    eventIndex: AnyNumberString
  ) => Types[K];
};

export const arenaConverter: ArenaConverter = {
  ArenaMeleeEvent: toArenaMeleeEvent,
  ArenaEnterEvent: toArenaEnterEvent,
  ArenaExitEvent: toArenaExitEvent,
  ArenaSwapEvent: toArenaSwapEvent,
  ArenaVaultBalanceUpdateEvent: toArenaVaultBalanceUpdateEvent,
};
