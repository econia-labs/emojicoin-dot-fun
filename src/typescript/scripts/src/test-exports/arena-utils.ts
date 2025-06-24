import { generateRandomSymbol } from "@econia-labs/emojicoin-sdk";
import { EmojicoinClient } from "@econia-labs/emojicoin-sdk/client";

import {
  depositToVault,
  ONE_SECOND_MICROSECONDS,
  registerAndUnlockInitialMarketsForArenaTest,
  setNextMeleeDurationAndEnsureCrank,
  waitUntilCurrentMeleeEnds,
} from "../../../sdk/tests/e2e/arena/utils";
import { getPublisher } from "../../../sdk/tests/utils";

const setNextDurationAndEnsureCrank = async (duration?: bigint) => {
  await setNextMeleeDurationAndEnsureCrank(duration).catch(async (e) => {
    if (e.message.includes("EXECUTION_LIMIT_REACHED")) {
      try {
        await registerAndUnlockInitialMarketsForArenaTest();
      } catch {
        // Swallow the error- we're just trying to make sure there's a crank.
      }
      // Also register a new market and unlock it to make sure a new melee can be started.
      const publisher = getPublisher();
      const emojicoin = new EmojicoinClient();
      const emojis = generateRandomSymbol().symbolEmojis;
      await emojicoin.register(publisher, emojis);
      await emojicoin.buy(publisher, emojis, 1n);
    }
  });
};

export {
  depositToVault,
  ONE_SECOND_MICROSECONDS,
  registerAndUnlockInitialMarketsForArenaTest,
  setNextDurationAndEnsureCrank,
  waitUntilCurrentMeleeEnds,
};
