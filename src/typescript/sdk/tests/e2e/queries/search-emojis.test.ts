import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { type EmojiName, namesToEmojis } from "../../../src";
import TestHelpers from "../../utils/helpers";
import { getFundedAccounts } from "../../utils/test-accounts";
import { fetchMarketsBySearchEmoji } from "../../../src/indexer-v2/queries/app/home-page";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2/queries/utils";

jest.setTimeout(20000);

describe("queries markets by the various emojis in their symbols", () => {
  const registrants = getFundedAccounts(
    "0x017c2212ba16749001d18156b870d938b120be49d56c082963f7a68ef08b9017",
    "0x018fa3a082d9f1afe7df368620ae3351fd07aa082408f8dbbb13c098d7cb2018",
    "0x0190a6acb80c86bbb1307f5f0928ec41c1feb925f70e9a21bbd4d6b71a99a019",
    "0x020a9f149bdcabd61a1633b35a85d0373807ec1ac2838364f08cd987892fc020",
    "0x021afbccf5d11f3fdf78edc9dfda3be05ecb00980dd15468af53ca9fea92e021",
    "0x022896263be80a07eb49c43aaf9c8ac1a24e723e5a75081a864608e507481022"
  );

  let latestTransactionVersion: number;

  // In order for these tests to work, *ANY* of the following emojis must *NOT* be used in any other
  // tests as part of a market symbol, because then the query for searching by emoji will return
  // multiple results that were not intended.
  const marketEmojiNames: EmojiName[][] = [
    ["fuel pump"],
    ["fuel pump", "raised fist"],
    ["fuel pump", "raised fist", "sun behind cloud"],
    ["raised fist", "fuel pump", "sun behind cloud"],
    ["fuel pump", "fuel pump"],
    ["fuel pump", "fuel pump", "fuel pump"],
  ];

  beforeAll(async () => {
    const registerAll = new Array<Promise<UserTransactionResponse>>();

    for (let i = 0; i < marketEmojiNames.length; i += 1) {
      const emojiNames = marketEmojiNames[i];
      registerAll.push(
        TestHelpers.registerMarketFromNames({
          registrant: registrants[i],
          emojiNames,
        }).then(({ registerResponse }) => registerResponse)
      );
    }

    const responses = await Promise.all(registerAll);
    expect(responses.every((r) => r.success)).toBe(true);

    latestTransactionVersion = Math.max(...responses.map((r) => r.version).map(Number));
    await waitForEmojicoinIndexer(latestTransactionVersion);
    return true;
  });

  it("searches with one emoji, finds all matching symbols", async () => {
    const searchEmojis = namesToEmojis("fuel pump");
    const res = await fetchMarketsBySearchEmoji({ searchEmojis, page: 1 });
    expect(res.length).toBe(6);
  });

  it("searches with two emojis, finds all matching symbols", async () => {
    const searchEmojis = namesToEmojis("fuel pump", "raised fist");
    const res = await fetchMarketsBySearchEmoji({ searchEmojis, page: 1 });
    expect(res.length).toBe(3);
  });

  it("searches with two emojis in reverse order, finds the same matching symbols", async () => {
    const searchEmojis = namesToEmojis("fuel pump", "raised fist");
    searchEmojis.reverse();
    const res = await fetchMarketsBySearchEmoji({ searchEmojis, page: 1 });
    expect(res.length).toBe(3);
  });

  it("searches with three emojis, finds all matching symbols", async () => {
    const searchEmojis = namesToEmojis("raised fist", "fuel pump", "sun behind cloud");
    const res = await fetchMarketsBySearchEmoji({ searchEmojis, page: 1 });
    expect(res.length).toBe(2);
  });
});
