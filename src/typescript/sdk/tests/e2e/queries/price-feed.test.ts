import {
  fetchPriceFeedWithMarketState,
  waitForEmojicoinIndexer,
} from "../../../src/indexer-v2/queries";
import path from "path";
import { getFundedAccount } from "../../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import { compareBigInt, maxBigInt, type SymbolEmoji, toSequenceNumberOptions } from "../../../src";
import { toPriceFeed } from "../../../src/indexer-v2/types";
import { SortMarketsBy } from "../../../src/indexer-v2/types/common";
import { ORDER_BY } from "../../../src/queries";

const pathRoot = path.join(__dirname, "./");

describe("queries price_feed and returns accurate price feed data", () => {
  it("checks that the price feed has correct market data", async () => {
    const acc = getFundedAccount("073");
    const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: 0 });
    const emojisAndInputAmounts: [SymbolEmoji[], number, number][] = [
      [["🧘"], 1000, 500],
      [["🧘🏻"], 1000, 1500],
      [["🧘🏼"], 1000, 2000],
      [["🧘🏽"], 1000, 10],
      [["🧘🏾"], 1000, 250],
      [["🧘🏿"], 500, 750],
    ];
    const toSeq = toSequenceNumberOptions;
    const results = await Promise.all(
      emojisAndInputAmounts.map(([emojis, buyAmount, sellAmount], i) =>
        emojicoin.register(acc, emojis, toSeq(i)).then(() =>
          emojicoin.buy(acc, emojis, buyAmount, toSeq(i + 1)).then(({ swap: buy }) =>
            emojicoin.sell(acc, emojis, sellAmount, toSeq(i + 2)).then(({ swap: sell }) => ({
              buy,
              sell,
            }))
          )
        )
      )
    );

    const maxTransactionVersion = maxBigInt(
      ...results.map(({ sell }) => sell.model.transaction.version)
    );
    await waitForEmojicoinIndexer(maxTransactionVersion);

    const limit = 500;
    const priceFeedView = await fetchPriceFeedWithMarketState({
      sortBy: SortMarketsBy.DailyVolume,
      orderBy: ORDER_BY.DESC,
      pageSize: limit,
    }).then((v) => v.map(toPriceFeed));

    // If the # of rows returned is >= `limit`, this test may fail, so ensure it fails here.
    expect(priceFeedView.length).toBeLessThan(limit);

    // Ensure it sorts by daily volume.
    const marketIDsFromView = priceFeedView.map((v) => v.market.marketID);
    const marketIDsSortedByDailyVolume = priceFeedView
      .toSorted((a, b) => compareBigInt(a.dailyVolume, b.dailyVolume))
      .map((v) => v.market.marketID);
    expect(marketIDsFromView).toEqual(marketIDsSortedByDailyVolume);

    // Ensure the prices returned are expected.
    emojisAndInputAmounts.forEach((inputs) => {
      const [symbolEmojis, openPrice, closePrice] = inputs;
      const rowInView = priceFeedView.find(
        (v) => v.market.symbolData.symbol === symbolEmojis.join("")
      )!;
      expect(rowInView).toBeDefined();
      expect(rowInView.openPrice).toEqual(openPrice);
      expect(rowInView.openPrice).toEqual(closePrice);
      expect(rowInView.deltaPercentage).toEqual(openPrice / closePrice);
    });
  });
});
