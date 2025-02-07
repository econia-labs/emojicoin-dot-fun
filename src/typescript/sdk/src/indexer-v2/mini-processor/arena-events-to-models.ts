import { AccountAddress, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { type TransactionMetadata, type DatabaseModels, GuidGetters } from "../types";
import { getEvents } from "../../emojicoin_dot_fun";
import { getTxnInfo } from "./event-groups/builder";
import { type Types } from "../../types/types";

export type ArenaEventsModels = {
  arenaMeleeEvents: DatabaseModels["arena_melee_events"][];
  arenaEnterEvents: DatabaseModels["arena_enter_events"][];
  arenaSwapEvents: DatabaseModels["arena_swap_events"][];
  arenaExitEvents: DatabaseModels["arena_exit_events"][];
  arenaVaultBalanceUpdateEvents: DatabaseModels["arena_vault_balance_update_events"][];
};

const snakeToCamel = ({
  meleeID,
  version,
  eventIndex,
}: Types["ArenaEnterEvent" | "ArenaExitEvent" | "ArenaMeleeEvent" | "ArenaSwapEvent"]) => ({
  melee_id: meleeID.toString(),
  transaction_version: version.toString(),
  event_index: eventIndex.toString(),
});

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
    arenaMeleeEvents: events.arenaMeleeEvents.map((melee) => ({
      ...GuidGetters.arenaMeleeEvent(snakeToCamel(melee)),
      melee,
      transaction,
    })),
    arenaEnterEvents: events.arenaEnterEvents.map((enter) => ({
      ...GuidGetters.arenaEnterEvent(snakeToCamel(enter)),
      enter,
      transaction,
    })),
    arenaSwapEvents: events.arenaSwapEvents.map((swap) => ({
      ...GuidGetters.arenaSwapEvent(snakeToCamel(swap)),
      swap,
      transaction,
    })),
    arenaExitEvents: events.arenaExitEvents.map((exit) => ({
      ...GuidGetters.arenaExitEvent(snakeToCamel(exit)),
      exit,
      transaction,
    })),
    arenaVaultBalanceUpdateEvents: events.arenaVaultBalanceUpdateEvents.map(
      (arenaVaultBalanceUpdate) => ({
        ...GuidGetters.arenaVaultBalanceUpdate({
          sender: AccountAddress.from(response.sender).toString(),
          event_index: arenaVaultBalanceUpdate.eventIndex.toString(),
          transaction_version: arenaVaultBalanceUpdate.version.toString(),
        }),
        arenaVaultBalanceUpdate,
        transaction,
      })
    ),
  };
}
