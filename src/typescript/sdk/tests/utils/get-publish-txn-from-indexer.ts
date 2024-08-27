import {
  Account,
  AccountAddress,
  Ed25519PrivateKey,
  Hex,
  isUserTransactionResponse,
  TransactionResponse,
} from "@aptos-labs/ts-sdk";
import { getEvents, Trigger } from "../../src";
import { getAptosClient } from "./aptos-client";
import { PublishPackageResult } from "./types";

export const getPublishTransactionFromIndexer = async (
  pk: string
): Promise<PublishPackageResult> => {
  const { aptos } = getAptosClient();
  const publisher = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(Hex.fromHexString(pk).toUint8Array()),
  });

  const transactions = await aptos.getAccountTransactions({
    accountAddress: publisher.accountAddress,
  });

  const txn = transactions.find(
    (tx: TransactionResponse) =>
      isUserTransactionResponse(tx) &&
      AccountAddress.from(tx.sender).equals(AccountAddress.from(publisher.accountAddress)) &&
      getEvents(tx).globalStateEvents.find((e) => e.trigger === Trigger.PackagePublication)
  );

  if (!(txn && isUserTransactionResponse(txn))) {
    throw new Error("No publish package transaction found.");
  }

  return {
    success: txn.success,
    sender: txn.sender,
    vm_status: txn.vm_status,
    version: Number(txn.version),
    sequence_number: Number(txn.sequence_number),
    gas_unit_price: Number(txn.gas_unit_price),
    gas_used: Number(txn.gas_used),
    transaction_hash: txn.hash,
    timestamp_us: Number(txn.timestamp),
  };
};
