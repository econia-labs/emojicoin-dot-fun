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

/**
 * Remove the leading zeros from a hex string that starts with `0x`.
 *
 * Typically used for shortening address-like strings.
 *
 * @param input
 * @returns the hex string without leading zeros
 * @example 0x00b -> 0xb
 * @example 0x00123 -> 0x123
 * @example 0x0 -> 0x0
 */
export const removeLeadingZeros = (input: `0x${string}` | AccountAddressInput) => {
  const address = toAccountAddressString(input);
  return address.replace(/^0x0*([0-9a-fA-F]+)$/, "0x$1") as `0x${string}`;
};
