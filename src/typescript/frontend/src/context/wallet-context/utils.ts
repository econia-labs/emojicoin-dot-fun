import { TypeTag, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import type { AccountInfo } from "@aptos-labs/wallet-adapter-core";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "react-toastify";
import { emoji } from "utils";

import type { TypeTagInput } from "@/sdk/emojicoin_dot_fun";
import { getArenaEventsAsProcessorModels } from "@/sdk/indexer-v2/mini-processor/arena";
import { getEventsAsProcessorModelsFromResponse } from "@/sdk/indexer-v2/mini-processor/event-groups";

export const setCoinTypeHelper = (
  set: Dispatch<SetStateAction<string | undefined>>,
  type?: TypeTagInput
) => {
  if (!type) set(undefined);
  else if (typeof type === "string") {
    set(type);
  } else if (type instanceof TypeTag) {
    set(type.toString());
  } else {
    throw new Error(`Invalid type: ${type}`);
  }
};

export const copyAddressHelper = async (account: AccountInfo | null) => {
  if (!account?.address) return;
  try {
    await navigator.clipboard.writeText(account.address);
    toast.success(`Copied address to clipboard! ${emoji("clipboard")}`, {
      pauseOnFocusLoss: false,
      autoClose: 2000,
    });
  } catch {
    toast.error(`Failed to copy address to clipboard. ${emoji("downcast face with sweat")}`, {
      pauseOnFocusLoss: false,
      autoClose: 2000,
    });
  }
};

export const getFlattenedEventModelsFromResponse = (response: UserTransactionResponse) => {
  const models = getEventsAsProcessorModelsFromResponse(response);
  const arenaModels = getArenaEventsAsProcessorModels(response);
  return [
    ...models.marketRegistrationEvents,
    ...models.periodicStateEvents,
    ...models.swapEvents,
    ...models.chatEvents,
    ...models.liquidityEvents,
    ...models.marketLatestStateEvents,
    ...arenaModels.arenaEnterEvents,
    ...arenaModels.arenaExitEvents,
    ...arenaModels.arenaMeleeEvents,
    ...arenaModels.arenaSwapEvents,
    ...arenaModels.arenaVaultBalanceUpdateEvents,
  ];
};
