import { fetchAllCurrentMeleeData } from "@econia-labs/emojicoin-sdk";
import {
  getAccountPrefix,
  getRandomFundedAccounts,
  setNextDurationAndEnsureCrank,
} from "src/test-exports";
import { makeRandomTrades } from "../utils/make-random-trades";
import { DEFAULT_MELEE_DURATION } from "../utils/const";

const LOG_FAILED = false;
const NUM_ACCOUNTS = 100;
const NUM_TRADES = 100;

export const main = async () => {
  const accounts = getRandomFundedAccounts(NUM_ACCOUNTS);

  // Try to crank, in case the current arena has ended.
  await setNextDurationAndEnsureCrank(DEFAULT_MELEE_DURATION);

  const melee = await fetchAllCurrentMeleeData();

  const results = await Promise.allSettled(
    accounts.map((account) =>
      makeRandomTrades({
        melee,
        account,
        numTrades: NUM_TRADES,
      }).catch(async (e) => {
        // Most likely, this error message means a new melee has started.
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
        const account = accounts[index];
        const prefix = getAccountPrefix(account);
        console.error(`Account ${prefix} failed:`, result.reason);
      }
    });
  }
};

main().then(() => console.log("Done!"));
