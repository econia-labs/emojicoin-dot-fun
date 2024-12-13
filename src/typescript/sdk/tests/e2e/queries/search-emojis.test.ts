import { type SymbolEmojiName, namesToEmojis } from "../../../src";
import TestHelpers from "../../utils/helpers";
import { getFundedAccounts } from "../../utils/test-accounts";
import { fetchMarkets } from "../../../src/indexer-v2/queries/app/home";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2/queries/utils";

jest.setTimeout(20000);

describe("queries markets by the various emojis in their symbols", () => {
  const registrants = getFundedAccounts("017", "018", "019", "020", "021", "022");

  let latestTransactionVersion: number;

  // In order for these tests to work, *ANY* of the following emojis must *NOT* be used in any other
  // tests as part of a market symbol, because then the query for searching by emoji will return
  // multiple results that were not intended.
  const marketEmojiNames: SymbolEmojiName[][] = [
    ["fuel pump"],
    ["fuel pump", "raised fist"],
    ["fuel pump", "raised fist", "sun behind cloud"],
    ["raised fist", "fuel pump", "sun behind cloud"],
    ["fuel pump", "fuel pump"],
    ["fuel pump", "fuel pump", "fuel pump"],
  ];

  beforeAll(async () => {
    const registerAll = marketEmojiNames.map((emojiNames, i) =>
      TestHelpers.registerMarketFromNames({
        registrant: registrants[i],
        emojiNames,
      }).then(({ registerResponse }) => registerResponse)
    );

    const responses = await Promise.all(registerAll);
    expect(responses.every((r) => r.success)).toBe(true);

    latestTransactionVersion = Math.max(...responses.map((r) => r.version).map(Number));
    await waitForEmojicoinIndexer(latestTransactionVersion);
    return true;
  });

  it("searches with one emoji, finds all matching symbols", async () => {
    const searchEmojis = namesToEmojis("fuel pump");
    const res = await fetchMarkets({ searchEmojis, page: 1 });
    expect(res.length).toBe(6);
  });

  it("searches with two emojis, finds all matching symbols", async () => {
    const searchEmojis = namesToEmojis("fuel pump", "raised fist");
    const res = await fetchMarkets({ searchEmojis, page: 1 });
    expect(res.length).toBe(3);
  });

  it("searches with two emojis in reverse order, finds the same matching symbols", async () => {
    const searchEmojis = namesToEmojis("fuel pump", "raised fist");
    searchEmojis.reverse();
    const res = await fetchMarkets({ searchEmojis, page: 1 });
    expect(res.length).toBe(3);
  });

  it("searches with three emojis, finds all matching symbols", async () => {
    const searchEmojis = namesToEmojis("raised fist", "fuel pump", "sun behind cloud");
    const res = await fetchMarkets({ searchEmojis, page: 1 });
    expect(res.length).toBe(2);
  });
});
