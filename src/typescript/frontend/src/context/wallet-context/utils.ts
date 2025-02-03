import {
  type UserTransactionResponse,
  AccountAddress,
  parseTypeTag,
  TypeTag,
} from "@aptos-labs/ts-sdk";
import { type AccountInfo } from "@aptos-labs/wallet-adapter-core";
import { getAptBalanceFromChanges, getCoinBalanceFromChanges } from "@sdk/utils";
import { type TypeTagInput } from "@sdk/emojicoin_dot_fun";
import { type Dispatch, type SetStateAction } from "react";
import { toast } from "react-toastify";
import { emoji } from "utils";
import { getEventsAsProcessorModelsFromResponse } from "@sdk/indexer-v2/mini-processor";

export const setBalancesFromWriteset = ({
  response,
  account,
  emojicoin,
  emojicoinLP,
  setAptBalance,
  setEmojicoinBalance,
  setEmojicoinLPBalance,
}: {
  response: UserTransactionResponse;
  account: AccountInfo | null;
  emojicoin?: string;
  emojicoinLP?: string;
  setAptBalance: (num: bigint) => void;
  setEmojicoinBalance: (num: bigint) => void;
  setEmojicoinLPBalance: (num: bigint) => void;
}) => {
  const userAddress = AccountAddress.from(response.sender);
  // Return if the account is not connected or the sender of the transaction is not the currently connected account.
  if (!account || !userAddress.equals(AccountAddress.from(account.address))) return;

  const newAptBalance = getAptBalanceFromChanges(response, userAddress);
  const newEmojicoinBalance = emojicoin
    ? getCoinBalanceFromChanges({ response, userAddress, coinType: parseTypeTag(emojicoin) })
    : undefined;
  const newEmojicoinLPBalance = emojicoinLP
    ? getCoinBalanceFromChanges({ response, userAddress, coinType: parseTypeTag(emojicoinLP) })
    : undefined;
  // Update the user's balance if the coins are present in the write set changes.
  if (typeof newAptBalance !== "undefined") setAptBalance(newAptBalance);
  if (typeof newEmojicoinBalance !== "undefined") setEmojicoinBalance(newEmojicoinBalance);
  if (typeof newEmojicoinLPBalance !== "undefined") setEmojicoinLPBalance(newEmojicoinLPBalance);
};

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
  return [
    ...models.marketRegistrationEvents,
    ...models.periodicStateEvents,
    ...models.swapEvents,
    ...models.chatEvents,
    ...models.liquidityEvents,
    ...models.marketLatestStateEvents,
  ];
};
