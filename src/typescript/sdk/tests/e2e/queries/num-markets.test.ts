import { getRegistryResourceFromWriteSet, toRegistryView } from "../../../src";
import { type SymbolEmojiName } from "../../../src/emoji_data/types";
import { RegistryView } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../../src/utils/aptos-client";
import TestHelpers from "../../../src/utils/test/helpers";
import { getFundedAccounts } from "../../../src/utils/test/test-accounts";

jest.setTimeout(20000);

describe("fetches the number of registered markets based on the latest processed version", () => {
  const aptos = getAptosClient();
  const registrants = getFundedAccounts("031", "032", "033", "034", "035", "036");

  let versionsAndNumMarkets: { version: bigint; numMarkets: bigint }[];

  const marketEmojiNames: SymbolEmojiName[][] = [
    ["supervillain"],
    ["supervillain: dark skin tone"],
    ["supervillain: light skin tone"],
    ["supervillain: medium skin tone"],
    ["supervillain: medium-dark skin tone"],
    ["supervillain: medium-light skin tone"],
  ];

  beforeAll(async () => {
    const registerAll = marketEmojiNames.map((emojiNames, i) =>
      TestHelpers.registerMarketFromNames({
        registrant: registrants[i],
        emojiNames,
      }).then(({ registerResponse }) => {
        expect(registerResponse.success).toBe(true);
        const registryResource = getRegistryResourceFromWriteSet(registerResponse)!;
        expect(registryResource).toBeDefined();
        expect(typeof registryResource.marketsByMarketID.size).toBe("bigint");
        return {
          version: BigInt(registerResponse.version),
          numMarkets: registryResource.marketsByMarketID.size,
        };
      })
    );

    versionsAndNumMarkets = await Promise.all(registerAll);
    return true;
  });

  it("gets the correct number of markets with specified transaction versions", async () => {
    const verifyAll = versionsAndNumMarkets.map(async ({ version, numMarkets: expected }) => {
      const res = await RegistryView.view({
        aptos,
        options: {
          ledgerVersion: Number(version),
        },
      }).then((r) => toRegistryView(r).numMarkets);
      expect(res).toBe(expected);
    });

    await Promise.all(verifyAll);
  });
});
