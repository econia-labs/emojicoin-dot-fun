import {
  fundedAccounts,
  getFundedAccount,
  getFundedAccounts,
} from "../../../sdk/tests/utils/test-accounts";
import { shuffle } from "lodash";
import { type Account } from "@aptos-labs/ts-sdk";

const getRandomFundedAccounts = (numAccounts: number) => {
  if (numAccounts > fundedAccounts.size) {
    throw new Error(`\`numAccounts\` must be less than ${fundedAccounts.size}`);
  }
  const accounts = Array.from(fundedAccounts.values());
  const shuffled = shuffle(accounts);
  const res = Array.from({ length: numAccounts })
    .map((_) => shuffled.pop())
    .filter((account) => !!account);
  return res;
};

const getAccountPrefix = (acc: Account) => acc.accountAddress.toString().substring(2, 5);

export {
  getAccountPrefix,
  getRandomFundedAccounts,
  fundedAccounts,
  getFundedAccount,
  getFundedAccounts,
};
