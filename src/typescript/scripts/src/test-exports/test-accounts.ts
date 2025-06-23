import type { Account } from "@aptos-labs/ts-sdk";
import { shuffle } from "lodash";

import type { FundedAccountIndex } from "../../../sdk/tests/utils/test-accounts";
import { getFundedAccount, getFundedAccounts } from "../../../sdk/tests/utils/test-accounts";

const getRandomFundedAccounts = (numAccounts: number) => {
  if (numAccounts > 1000) {
    throw new Error(`\`numAccounts\` must be less than 1000`);
  }
  const accounts = Array.from({ length: numAccounts })
    .map((_, i) => i.toString().padStart(3, "0") as FundedAccountIndex)
    .map(getFundedAccount);

  return shuffle(accounts);
};

const getAccountPrefix = (acc: Account) => acc.accountAddress.toString().substring(2, 5);

export { getAccountPrefix, getFundedAccount, getFundedAccounts, getRandomFundedAccounts };
