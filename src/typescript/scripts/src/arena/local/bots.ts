import { fetchAllCurrentMeleeData } from "@econia-labs/emojicoin-sdk";
import {
  getAccountPrefix,
  getRandomFundedAccounts,
  setNextDurationAndEnsureCrank,
} from "src/test-exports";

import { DEFAULT_MELEE_DURATION } from "../utils/const";
import { makeRandomTrades } from "../utils/make-random-trades";
import { generatePricePath } from "../utils/price-path";

const LOG_FAILED = false;
export const NUM_ACCOUNTS = 100;
export const NUM_TRADES = 100;
const ACCOUNTS = getRandomFundedAccounts(NUM_ACCOUNTS);

const { inputAmounts } = generatePricePath(NUM_ACCOUNTS * NUM_TRADES, 1000000000n);

export const main = async () => {
  // Try to crank, in case the current arena has ended.
  await setNextDurationAndEnsureCrank(DEFAULT_MELEE_DURATION);

  const melee = await fetchAllCurrentMeleeData();

  const results = await Promise.allSettled(
    ACCOUNTS.map((account) =>
      makeRandomTrades({
        melee,
        account,
        inputAmounts,
      }).catch(async (e) => {
        // Most likely, a new melee has started. Refetch and reset it.
        if (e.message.includes("E_INVALID_COIN_TYPES")) {
          console.log("The melee has ended. Restart this script.");
        }
        throw new Error(e);
      })
    )
  );

  if (LOG_FAILED) {
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        const account = ACCOUNTS[index];
        const prefix = getAccountPrefix(account);
        console.error(`Account ${prefix} failed:`, result.reason);
      }
    });
  }
};

main().then(() => console.log("Done!"));
