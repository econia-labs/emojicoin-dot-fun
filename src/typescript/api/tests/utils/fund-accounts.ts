import {
  type Aptos,
  type Account,
  MoveVector,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { ONE_APT } from "../../src";

// Instead of calling the faucet for each account, we fund one twice and have it distribute them
// evenly among the rest with the `batch_transfer` function.
// This results in 2 fund requests and 1 transaction instead of N fund requests. For running tests,
// this saves 10-15 seconds each run.
export async function fundAccounts(aptos: Aptos, accounts: Array<Account>) {
  // Fund first account
  const firstAccount = accounts[0];
  // Fund the first account twice to make sure it has enough coins to send to the rest
  await aptos.fundAccount({
    accountAddress: firstAccount.accountAddress,
    amount: ONE_APT,
  });
  await aptos.fundAccount({
    accountAddress: firstAccount.accountAddress,
    amount: ONE_APT,
  });
  // Get the addresses for `accounts[1..n]`
  const addressesRemaining = accounts.slice(1).map((account) => account.accountAddress);
  const amountToSend = Math.floor((ONE_APT * 2) / accounts.length);
  // Send coins from `account[0]` to `account[1..n]`
  const transaction = await aptos.transaction.build.simple({
    sender: firstAccount.accountAddress,
    data: {
      function: "0x1::aptos_account::batch_transfer",
      functionArguments: [
        new MoveVector(addressesRemaining),
        MoveVector.U64(addressesRemaining.map(() => amountToSend)),
      ],
    },
  });
  const signedTxn = aptos.transaction.sign({
    signer: firstAccount,
    transaction,
  });
  const transactionResponse = await aptos.transaction.submit.simple({
    transaction,
    senderAuthenticator: signedTxn,
  });
  const response = await aptos.waitForTransaction({
    transactionHash: transactionResponse.hash,
  });
  return response as UserTransactionResponse;
}
