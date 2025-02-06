import { maxBigInt, sleep, zip } from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { type SymbolEmoji } from "../../../src/emoji_data/types";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2";
import { getAptosClient } from "../../utils";
import { getFundedAccounts } from "../../utils/test-accounts";

describe("tests to ensure that arena websocket events work as expected", () => {
  const registrants = getFundedAccounts("085", "086", "087", "088");
  const aptos = getAptosClient();
  const symbols: SymbolEmoji[][] = [["🦈"], ["🐟"], ["🦭"], ["🐙"]];
  const emojicoin = new EmojicoinClient();

  beforeAll(async () => {
    const versions = await Promise.all(
      zip(registrants, symbols).map(async ([registrant, symbol]) =>
        emojicoin
          .register(registrant, symbol)
          .then((res) => res.registration.model.transaction.version)
      )
    );
    const highestVersion = maxBigInt(...versions);
    await waitForEmojicoinIndexer(highestVersion, 10000);
    // Ensure the broker has emitted all events to ensure they don't interfere with the following tests.
    await sleep(2000);
    return true;
  });

  it("receives an arena event within two seconds of the event being submitted", async () => {});
});
