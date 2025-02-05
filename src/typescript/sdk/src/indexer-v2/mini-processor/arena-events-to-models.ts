import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { type TransactionMetadata, type DatabaseModels } from "../types";
import { getEvents } from "../../emojicoin_dot_fun";
import { getTxnInfo } from "./event-groups/builder";

export type ArenaEventsModels = {
  arenaMeleeEvents: DatabaseModels["arena_melee_events"][];
  arenaEnterEvents: DatabaseModels["arena_enter_events"][];
  arenaSwapEvents: DatabaseModels["arena_swap_events"][];
  arenaExitEvents: DatabaseModels["arena_exit_events"][];
  arenaVaultBalanceUpdateEvents: DatabaseModels["arena_vault_balance_update_events"][];
};

export function getArenaEventsAsProcessorModels(
  response: UserTransactionResponse
): ArenaEventsModels {
  const events = getEvents(response);
  const txnInfo = getTxnInfo(response);
  const transaction: TransactionMetadata = {
    ...txnInfo,
    timestamp: new Date(Number(txnInfo.time / 1000n)),
    // This is only for the database. Just insert a null-like value.
    insertedAt: new Date(0),
  };
  return {
    arenaMeleeEvents: events.arenaMeleeEvents.map((arenaMelee) => ({ arenaMelee, transaction })),
    arenaEnterEvents: events.arenaEnterEvents.map((arenaEnter) => ({ arenaEnter, transaction })),
    arenaSwapEvents: events.arenaSwapEvents.map((arenaSwap) => ({ arenaSwap, transaction })),
    arenaExitEvents: events.arenaExitEvents.map((arenaExit) => ({ arenaExit, transaction })),
    arenaVaultBalanceUpdateEvents: events.arenaVaultBalanceUpdateEvents.map(
      (arenaVaultBalanceUpdate) => ({
        arenaVaultBalanceUpdate,
        transaction,
      })
    ),
  };
}
