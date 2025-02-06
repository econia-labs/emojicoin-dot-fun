import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  type ArenaExitModel,
  type ArenaEnterModel,
  type ArenaMeleeModel,
  type ArenaSwapModel,
  type ArenaVaultBalanceUpdateModel,
} from "../../../src/indexer-v2";
import { getEvents } from "../../../src";
import { checkTuples, compareTransactionMetadata } from "./equality-checks";
import { type JsonValue } from "../../../src/types/json-types";

const expandAsTuple = <T>(label: string, k: keyof T, row: T, event: T) =>
  [`${label}.${String(k)}`, row[k], event[k]] as [
    string,
    JsonValue | undefined,
    JsonValue | undefined,
  ];

const ArenaEnter = (row: ArenaEnterModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const enter = events.arenaEnterEvents.at(0)!;
  expect(enter).toBeDefined();
  compareTransactionMetadata(row, response);

  const tuples = Object.keys(row.enter)
    .map((k) => k as keyof typeof row.enter)
    .map((k) => expandAsTuple("arenaEnter", k, row.enter, enter));
  checkTuples(tuples);
};

const ArenaExit = (row: ArenaExitModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const exit = events.arenaExitEvents.at(0)!;
  expect(exit).toBeDefined();
  compareTransactionMetadata(row, response);

  const tuples = Object.keys(row.exit)
    .map((k) => k as keyof typeof row.exit)
    .map((k) => expandAsTuple("arenaExit", k, row.exit, exit));
  checkTuples(tuples);
};

const ArenaMelee = (row: ArenaMeleeModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const melee = events.arenaMeleeEvents.at(0)!;
  expect(melee).toBeDefined();
  compareTransactionMetadata(row, response);

  const tuples = Object.keys(row.melee)
    .map((k) => k as keyof typeof row.melee)
    .map((k) => expandAsTuple("arenaMelee", k, row.melee, melee));
  checkTuples(tuples);
};

const ArenaSwap = (row: ArenaSwapModel, response: UserTransactionResponse) => {
  const events = getEvents(response);
  const swap = events.arenaSwapEvents.at(0)!;
  expect(swap).toBeDefined();
  compareTransactionMetadata(row, response);

  const tuples = Object.keys(row.swap)
    .map((k) => k as keyof typeof row.swap)
    .map((k) => expandAsTuple("arenaSwap", k, row.swap, swap));
  checkTuples(tuples);
};

const ArenaVaultBalanceUpdate = (
  row: ArenaVaultBalanceUpdateModel,
  response: UserTransactionResponse
) => {
  const events = getEvents(response);
  const update = events.arenaVaultBalanceUpdateEvents.at(0)!;
  expect(update).toBeDefined();
  compareTransactionMetadata(row, response);

  const tuples = Object.keys(row.arenaVaultBalanceUpdate)
    .map((k) => k as keyof typeof row.arenaVaultBalanceUpdate)
    .map((k) => expandAsTuple("arenaVaultBalanceUpdate", k, row.arenaVaultBalanceUpdate, update));
  checkTuples(tuples);
};

const ArenaRowEqualityChecks = {
  ArenaEnter,
  ArenaExit,
  ArenaMelee,
  ArenaSwap,
  ArenaVaultBalanceUpdate,
};

export default ArenaRowEqualityChecks;
