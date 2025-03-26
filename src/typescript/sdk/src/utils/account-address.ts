import {
  type Account,
  AccountAddress,
  type AccountAddressInput,
  type Ed25519Account,
  type SingleKeyAccount,
} from "@aptos-labs/ts-sdk";

export const padAddressInput = <T>(s: T) =>
  typeof s === "string"
    ? s.startsWith("0x")
      ? `0x${s.substring(2).padStart(64, "0")}`
      : `0x${s.padStart(64, "0")}`
    : s;

export const standardizeAddress = (address: AccountAddressInput) =>
  AccountAddress.from(padAddressInput(address)).toString();

type AnyAccount = Ed25519Account | SingleKeyAccount | SingleKeyAccount | Account;

export const toAccountAddress = (input: AnyAccount | AccountAddressInput) =>
  AccountAddress.from(
    typeof input === "object" && "accountAddress" in input
      ? input.accountAddress
      : padAddressInput(input)
  );

export const toAccountAddressString = (input: AnyAccount | AccountAddressInput) =>
  toAccountAddress(padAddressInput(input)).toString();

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
