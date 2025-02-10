import { getRegistryResourceFromWriteSet, toRegistryView } from "../../../src";
import { type SymbolEmojiName } from "../../../src/emoji_data/types";
import { RegistryView } from "@/contract-apis/emojicoin-dot-fun";
import { getAptosClient } from "../../../src/utils/aptos-client";
import TestHelpers from "../../utils/helpers";
import { getFundedAccounts } from "../../utils/test-accounts";
import {
  fetchLargestMarketID,
  postgrest,
  TableName,
  toMarketRegistrationEventModel,
} from "../../../src/indexer-v2";

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
      })
        .then(toRegistryView)
        .then((r) => r.numMarkets);
      expect(res).toBe(expected);
    });

    await Promise.all(verifyAll);
  });

  it("gets the number of registered markets by selecting the largest market ID", async () => {
    const largestMarketID = await fetchLargestMarketID();
    // Now manually select the market registration event, in case the market has had activity since
    // being registered.
    const marketRegistrationModel = await postgrest
      .from(TableName.MarketRegistrationEvents)
      .select("*")
      .eq("market_id", largestMarketID)
      .single()
      .then((res) => res.data)
      .then(toMarketRegistrationEventModel);

    const { version } = marketRegistrationModel.transaction;
    const numMarketsAtVersion = await RegistryView.view({
      aptos,
      options: {
        ledgerVersion: version,
      },
    })
      .then(toRegistryView)
      .then((res) => res.numMarkets)
      .then(Number);
    expect(largestMarketID).toBe(numMarketsAtVersion);
  });
});
