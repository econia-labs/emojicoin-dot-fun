import { Account, type Ed25519Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import testAccountData from "../../../../docker/deployer/json/test-accounts.json";

export type FundedAddress = keyof typeof testAccountData;
type D = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
export type FundedAccountIndex = `${D}${D}${D}`;
export type FundedAddressIndex = FundedAccountIndex;
const DIGITS = 3;
export const fundedAccounts = new Map<FundedAccountIndex, Ed25519Account>(
  Object.entries(testAccountData).map(([addressWith0x, privateKeyString]) => {
    const address = addressWith0x.replace(/^0x/, "");
    const { length } = address;
    const [prefix, suffix] = [
      address.substring(0, DIGITS),
      address.substring(length - DIGITS, length),
    ];
    if (prefix !== suffix) {
      throw new Error("Prefix and suffix for the addresses should be the same.");
    }
    const index = prefix as FundedAccountIndex;
    const privateKey = new Ed25519PrivateKey(privateKeyString);
    const account = Account.fromPrivateKey({ privateKey });
    return [index, account];
  })
);

/**
 * Each invocation of this function must be mindful in that the index passed in needs to be unique.
 *
 * It's not possible (or at least, easy) to track global state in jest unit tests, but funding
 * accounts wastes a lot of time, so we just provide unique addresses to each function that are
 * already pre-funded with this function.
 *
 * Note the prefix passed is also the suffix, where the prefix/suffix are for the account's address.
 * This makes it a little easier to see the address when testing things and looking for the specific
 * address in a row or a field.
 *
 * @param prefix - The index as a string of the account to instantiate as an `Account` object and
 * return. This is also the prefix and suffix for the address.
 * @example
 * ```typescript
 * const account = getFundedAccount("012");
 * // Returns the account where:
 * // address        =>   "0x012431335d02cc4e9a7e49457a8aaeca6550300b397394254691d242a8f06012",
 * // prefix/suffix  =>   "0x012                                                          012",
 * // privateKey     =>   "0xf88d3bb398804e7e10f049f385237881aa3178cd406d2eaef4d613f1d02f8934",
 * ```
 */
export const getFundedAccount = (prefix: FundedAccountIndex) => {
  const account = fundedAccounts.get(prefix);
  if (!account) {
    throw new Error(`Invalid address passed: ${prefix}`);
  }
  return account;
};

export const getFundedAccounts = (...prefixes: Array<FundedAccountIndex>) =>
  prefixes.map(getFundedAccount);
