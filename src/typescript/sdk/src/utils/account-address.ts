import {
  Account,
  AccountAddress,
  Ed25519Account,
  SingleKeyAccount,
  type AccountAddressInput,
} from "@aptos-labs/ts-sdk";

export const standardizeAddress = (address: AccountAddressInput) =>
  AccountAddress.from(address).toString();

type AnyAccount = Ed25519Account | SingleKeyAccount | SingleKeyAccount | Account;

export const toAccountAddress = (input: AnyAccount | AccountAddressInput) =>
  AccountAddress.from(
    input instanceof Ed25519Account ||
      input instanceof SingleKeyAccount ||
      input instanceof SingleKeyAccount ||
      input instanceof Account
      ? input.accountAddress
      : input
  );

export const toAccountAddressString = (input: AnyAccount | AccountAddressInput) =>
  toAccountAddress(input).toString();
