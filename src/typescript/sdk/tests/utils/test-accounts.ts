import { Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import testAccountData from "../../../../docker/deployer/json/test-accounts.json";

export type FundedAccount = keyof typeof testAccountData;

/**
 * Each invocation of this function must be mindful in that the account string needs to be unique.
 * It's not possible (or at least, easy) to track global state in jest unit tests, but funding
 * accounts wastes a lot of time, so we just provide unique addresses to each function that are
 * already pre-funded with this function.
 *
 * @param address - The address of the account to instantiate as an `Account` object and return.
 */
export const getFundedAccount = (address: FundedAccount) => {
  const privateKey = testAccountData[address];
  return Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(privateKey) });
};

export const getFundedAccounts = (...addresses: Array<FundedAccount>) =>
  addresses.map(getFundedAccount);
