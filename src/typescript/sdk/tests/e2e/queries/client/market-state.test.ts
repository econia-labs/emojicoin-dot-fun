import { type SymbolEmoji } from "../../../../src";
import { getFundedAccount } from "../../../../src/utils/test/test-accounts";
import { waitForEmojicoinIndexer } from "../../../../src/indexer-v2/queries/utils";
import { fetchMarketState } from "../../../../src/indexer-v2/queries";
import { type MarketStateModel } from "../../../../src/indexer-v2/types";
import { type JsonValue } from "../../../../src/types/json-types";
import { EmojicoinClient } from "../../../../src/client/emojicoin-client";

jest.setTimeout(20000);

describe("queries a market by market state with the emojicoin client", () => {
  const registrant = getFundedAccount("048");
  const emojicoin = new EmojicoinClient();

  it("fetches the market state for a market based on an emoji symbols array", async () => {
    const emojis: SymbolEmoji[] = ["♻️", "🤕"];
    const res = await emojicoin
      .register(registrant, emojis)
      .then(({ response }) => waitForEmojicoinIndexer(response.version))
      .then(() => fetchMarketState({ searchEmojis: emojis }));
    expect(res).not.toBeNull();
    expect(res).toBeDefined();
    expect(res!.dailyVolume).toEqual(0n);

    const results = await emojicoin.rewards.buy(registrant, emojis, 1234n).then((res) =>
      waitForEmojicoinIndexer(res.response.version).then(() =>
        fetchMarketState({ searchEmojis: emojis }).then((stateFromIndexerProcessor) => ({
          stateFromMiniProcessor: res.models.marketLatestStateEvents.at(0),
          stateFromIndexerProcessor,
        }))
      )
    );

    const { stateFromMiniProcessor, stateFromIndexerProcessor } = results;
    expect(stateFromMiniProcessor).not.toBeNull();
    expect(stateFromIndexerProcessor).not.toBeNull();

    // Copy over the daily volume because we can't get that field from the mini processor.
    (stateFromMiniProcessor as MarketStateModel).dailyVolume =
      stateFromIndexerProcessor!.dailyVolume;
    // Copy over the `insertedAt` field because it's inserted at insertion time in postgres.
    (stateFromMiniProcessor as MarketStateModel).transaction.insertedAt =
      stateFromIndexerProcessor!.transaction.insertedAt;

    const replacer = (_: string, v: JsonValue) => (typeof v === "bigint" ? v.toString() : v);
    const res1 = JSON.stringify(stateFromMiniProcessor, replacer);
    const res2 = JSON.stringify(stateFromIndexerProcessor, replacer);
    expect(res1).toEqual(res2);
  });
});
