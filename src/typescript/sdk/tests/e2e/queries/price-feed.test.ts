import {
  fetchPriceFeedWithMarketState,
  waitForEmojicoinIndexer,
} from "../../../src/indexer-v2/queries";
import { getFundedAccount } from "../../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import {
  type AnyNumberString,
  compareBigInt,
  maxBigInt,
  type SymbolEmoji,
  toSequenceNumberOptions,
} from "../../../src";
import { calculateDeltaPercentageForQ64s, toPriceFeed } from "../../../src/indexer-v2/types";
import { SortMarketsBy } from "../../../src/indexer-v2/types/common";
import { ORDER_BY } from "../../../src/queries";
import Big from "big.js";

const percentageOfInputToBigInt = (amount: AnyNumberString, percentage: number) =>
  BigInt(
    Big(amount.toString())
      .mul(1 + percentage)
      .round(0, Big.roundDown)
      .toNumber()
  );

describe("queries price_feed and returns accurate price feed data", () => {
  it("checks that the price feed has correct market data", async () => {
    const acc = getFundedAccount("073");
    const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: 0 });
    const emojisAndInputAmounts: [SymbolEmoji[], bigint, number][] = [
      // emoji, buy amount, second amount (percentage of output from buy)
      // Note the percentage here doesn't indicate the delta percentage, since that's determined
      // by the output average execution price, not the input amount.
      [["🧘"], 10000n, -0.75],
      [["🧘🏻"], 1000n, 0.9],
      [["🧘🏼"], 1000n, 1],
      [["🧘🏽"], 1000n, -0.05],
      [["🧘🏾"], 1000n, -0.25],
      [["🧘🏿"], 500n, 0.25],
    ];
    const results = await Promise.all(
      emojisAndInputAmounts.map(([emojis, buyAmount, percentOfOutput], i) =>
        emojicoin.register(acc, emojis, toSequenceNumberOptions(i * 3 + 0)).then(() =>
          emojicoin
            .buy(acc, emojis, buyAmount, toSequenceNumberOptions(i * 3 + 1))
            .then(({ swap: openSwap }) =>
              (percentOfOutput > 0 ? emojicoin.buy : emojicoin.sell)(
                acc,
                emojis,
                percentageOfInputToBigInt(openSwap.model.swap.netProceeds, percentOfOutput),
                toSequenceNumberOptions(i * 3 + 2)
              ).then(({ swap: closeSwap }) => ({
                openSwap,
                closeSwap,
              }))
            )
        )
      )
    );

    const maxTransactionVersion = maxBigInt(
      ...results.map(({ closeSwap }) => closeSwap.model.transaction.version)
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
      .reverse() // Sort by daily volume *descending*.
      .map((v) => v.market.marketID);
    expect(marketIDsFromView).toEqual(marketIDsSortedByDailyVolume);

    // Ensure the prices returned are expected.
    results.forEach(({ openSwap, closeSwap }) => {
      const symbolEmojis = openSwap.model.market.symbolEmojis;
      expect(closeSwap.model.market.symbolEmojis).toEqual(symbolEmojis);
      const [_, firstAmount, percentageOfFirst] = emojisAndInputAmounts.find(
        ([emojis, _swap1, _swap2]) => emojis.join("") == symbolEmojis.join("")
      )!;
      expect(firstAmount).toBeDefined();
      expect(percentageOfFirst).toBeDefined();
      expect(firstAmount).toEqual(openSwap.model.swap.inputAmount);
      expect(closeSwap.model.swap.inputAmount).toEqual(
        percentageOfInputToBigInt(openSwap.model.swap.netProceeds, percentageOfFirst)
      );
      const [open, close] = [
        openSwap.model.swap.avgExecutionPriceQ64,
        closeSwap.model.swap.avgExecutionPriceQ64,
      ];
      const expectedPercentage = calculateDeltaPercentageForQ64s(open, close);
      const rowInView = priceFeedView.find(
        (v) => v.market.symbolEmojis.join("") === symbolEmojis.join("")
      )!;
      expect(rowInView).toBeDefined();
      expect(rowInView.deltaPercentage).toEqual(expectedPercentage);
    });
  });
});
