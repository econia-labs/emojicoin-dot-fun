import { getDbConnection } from "../../helpers";
import {
  fetchPriceFeed,
  fetchPriceFeedAndMarketData,
  fetchPriceFeedWithMarketState,
  waitForEmojicoinIndexer,
} from "../../../../src/indexer-v2/queries";
import path from "path";
import { getFundedAccount } from "../../../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../../../src/client/emojicoin-client";
import { compareBigInt, maxBigInt, SymbolEmoji, toSequenceNumberOptions } from "../../../../src";

const pathRoot = path.join(__dirname, "./");

describe("queries price_feed and returns accurate price feed data", () => {
  it.skip("checks price feed results generated from artificial data", async () => {
    const db = getDbConnection();

    // Insert a swap 25 hours ago at price 500
    await db.file(`${pathRoot}test_1_insert_past_day_swap.sql`);

    // Insert a fresh swap at price 750
    await db.file(`${pathRoot}test_1_insert_current_day_swap.sql`);

    // Update market_latest_state_event accordingly
    await db.file(`${pathRoot}test_1_insert_market_state.sql`);

    // Insert a swap 10 hours ago at price 1000
    await db.file(`${pathRoot}test_2_insert_earlier_swap.sql`);

    // Insert a fresh swap at price 250
    await db.file(`${pathRoot}test_2_insert_later_swap.sql`);

    // Update market_latest_state_event accordingly
    await db.file(`${pathRoot}test_2_insert_market_state.sql`);

    const priceFeed = await fetchPriceFeed({});
    const market_777701 = priceFeed.find((m) => m.marketID === 777701n);
    expect(market_777701).toBeDefined();
    expect(market_777701!.marketID).toEqual(777701n);
    expect(market_777701!.openPrice).toEqual(500n);
    expect(market_777701!.closePrice).toEqual(750n);
    expect(market_777701!.deltaPercentage).toEqual(50);

    const market_777702 = priceFeed.find((m) => m.marketID === 777702n);
    expect(market_777702).toBeDefined();
    expect(market_777702!.marketID).toEqual(777702n);
    expect(market_777702!.openPrice).toEqual(1000n);
    expect(market_777702!.closePrice).toEqual(250n);
    expect(market_777702!.deltaPercentage).toEqual(-75);
  });

  it("checks that the price feed has correct market data", async () => {
    const acc = getFundedAccount("073");
    const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: 0 });
    const emojisAndInputAmounts: [SymbolEmoji[], bigint, bigint][] = [
      [["🧘"], 1000n, 500n],
      [["🧘🏻"], 1000n, 1500n],
      [["🧘🏼"], 1000n, 2000n],
      [["🧘🏽"], 1000n, 10n],
      [["🧘🏾"], 1000n, 10000n],
      [["🧘🏿"], 1000n, 100000n],
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

    const priceFeedView = await fetchPriceFeedWithMarketState({});
    const priceFeed = await fetchPriceFeedAndMarketData();

    const marketIDs1 = priceFeedView.map((v) => v.market.marketID);
    const marketIDs2 = priceFeed.map((v) => v.marketData.market.marketID);

    expect(marketIDs1).toEqual(marketIDs2);

    const deltas1 = priceFeedView.map((v) => v.deltaPercentage);
    const deltas2 = priceFeed.map((v) => v.marketPriceFeed.deltaPercentage);

    expect(deltas1).toEqual(deltas2);

    emojisAndInputAmounts.forEach((inputs) => {
      const [symbolEmojis, openPrice, closePrice] = inputs;
      const rowInView = priceFeedView.find(
        (v) => v.market.symbolData.symbol === symbolEmojis.join("")
      )!;
      expect(rowInView).toBeDefined();
      expect(rowInView.openPrice).toEqual(openPrice);
      expect(rowInView.openPrice).toEqual(closePrice);
    });
  });
});
