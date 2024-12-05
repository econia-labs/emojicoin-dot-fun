import { type SymbolEmoji } from "../../../src";
import TestHelpers from "../../utils/helpers";
import { getFundedAccount } from "../../utils/test-accounts";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2/queries/utils";
import { SwapWithRewards } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../utils";
import { fetchMarketState } from "../../../src/indexer-v2/queries";
import { type MarketStateModel } from "../../../src/indexer-v2/types";
import { type JsonValue } from "../../../src/types/json-types";
import { getEventsAsProcessorModelsFromResponse } from "../../../src/indexer-v2/mini-processor";

jest.setTimeout(20000);

describe("queries a market by market state", () => {
  const aptos = getAptosClient();
  const registrant = getFundedAccount("037");

  it("fetches the market state for a market based on an emoji symbols array", async () => {
    const emojis: SymbolEmoji[] = ["🧐", "🧐"];
    const { registerResponse, marketAddress, emojicoin, emojicoinLP } =
      await TestHelpers.registerMarketFromEmojis({
        registrant,
        emojis,
      });
    const { version } = registerResponse;
    await waitForEmojicoinIndexer(version);
    const res = (await fetchMarketState({
      searchEmojis: emojis,
    }))!;
    expect(res).not.toBeNull();
    expect(res).toBeDefined();
    expect(res.dailyVolume).toEqual(0n);

    const inputAmount = 1234n;
    const swapResponse = await SwapWithRewards.submit({
      aptosConfig: aptos.config,
      swapper: registrant,
      inputAmount,
      marketAddress,
      isSell: false,
      minOutputAmount: 1n,
      typeTags: [emojicoin, emojicoinLP],
    });
    const miniProcessorResult = getEventsAsProcessorModelsFromResponse(swapResponse);
    const stateFromMiniProcessor = miniProcessorResult.marketLatestStateEvents.at(0)!;
    expect(stateFromMiniProcessor).toBeDefined();
    await waitForEmojicoinIndexer(swapResponse.version);
    const stateFromIndexerProcessor = (await fetchMarketState({ searchEmojis: emojis }))!;

    // Copy over the daily volume because we can't get that field from the mini processor.
    (stateFromMiniProcessor as MarketStateModel).dailyVolume =
      stateFromIndexerProcessor.dailyVolume;
    // Copy over the `insertedAt` field because it's inserted at insertion time in postgres.
    (stateFromMiniProcessor as MarketStateModel).transaction.insertedAt =
      stateFromIndexerProcessor.transaction.insertedAt;

    const replacer = (_: string, v: JsonValue) => (typeof v === "bigint" ? v.toString() : v);
    const res1 = JSON.stringify(stateFromMiniProcessor, replacer);
    const res2 = JSON.stringify(stateFromIndexerProcessor, replacer);
    expect(res1).toEqual(res2);
  });
});
