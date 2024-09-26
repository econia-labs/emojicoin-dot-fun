import {
  type Account,
  AccountAddress,
  type Ed25519Account,
  type SingleKeyAccount,
  type AccountAddressInput,
} from "@aptos-labs/ts-sdk";

export const standardizeAddress = (address: AccountAddressInput) =>
  AccountAddress.from(address).toString();

type AnyAccount = Ed25519Account | SingleKeyAccount | SingleKeyAccount | Account;

export const toAccountAddress = (input: AnyAccount | AccountAddressInput) =>
  AccountAddress.from(
    typeof input === "object" && "accountAddress" in input ? input.accountAddress : input
  );

export const toAccountAddressString = (input: AnyAccount | AccountAddressInput) =>
  toAccountAddress(input).toString();
