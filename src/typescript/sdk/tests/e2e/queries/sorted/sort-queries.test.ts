import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  compareBigInt,
  getEmojicoinMarketAddressAndTypeTags,
  getEvents,
  ONE_APT,
  sleep,
  SYMBOL_EMOJI_DATA,
  type SymbolEmojiName,
  UnitOfTime,
} from "../../../../src";
import TestHelpers from "../../../utils/helpers";
import { getFundedAccounts } from "../../../utils/test-accounts";
import { waitForEmojicoinIndexer } from "../../../../src/indexer-v2/queries/utils";
import { Swap } from "../../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../../utils";
import { fetchMarkets } from "../../../../src/indexer-v2/queries/app/home";
import { SortMarketsBy } from "../../../../src/indexer-v2/types/common";
import {
  checkOrder,
  checkSubsetsEqual,
  sortBigIntPairsReversed,
  sortWithUnsortedSubsets,
  toSortableResults,
} from "./utils";

jest.setTimeout(20000);

describe("sorting queries for the sort filters on the home page", () => {
  const aptos = getAptosClient();
  const registrants = getFundedAccounts("023", "024", "025", "026", "027", "028", "029", "030");

  let latestTransactionVersion: number;

  // In order for these tests to work, *NONE* of the following emojis can be used in any other tests
  // as part of a market symbol, because then the query for searching by emoji will return multiple
  // results that were not intended.
  const marketEmojiNames: SymbolEmojiName[][] = [
    ["vampire"],
    ["vampire", "drop of blood"],
    ["vampire", "sweat droplets"],
    ["vampire: dark skin tone"],
    ["vampire: light skin tone"],
    ["vampire: medium skin tone"],
    ["vampire: medium-dark skin tone"],
    ["vampire: medium-light skin tone"],
  ];
  const baseVampireEmoji = SYMBOL_EMOJI_DATA.byStrictName("vampire").emoji;

  beforeAll(async () => {
    const registerAndSwap = new Array<
      Promise<[UserTransactionResponse, UserTransactionResponse]>
    >();

    for (let i = 0; i < marketEmojiNames.length; i += 1) {
      const emojiNames = marketEmojiNames[i];
      registerAndSwap.push(
        TestHelpers.registerMarketFromNames({
          registrant: registrants[i],
          emojiNames,
        }).then(async ({ registerResponse }) => {
          const events = getEvents(registerResponse);
          const { marketMetadata } = events.marketRegistrationEvents[0];
          const { marketAddress, emojicoin, emojicoinLP } = getEmojicoinMarketAddressAndTypeTags({
            symbolBytes: marketMetadata.emojiBytes,
          });
          // Sleep in reverse order to mix up the bump order of the markets so it doesn't match
          // the volume queries, since the inputAmounts are in order according to the index `i`.
          await sleep(marketEmojiNames.length - i, UnitOfTime.Seconds);
          const swap = Swap.submit({
            aptosConfig: aptos.config,
            swapper: registrants[i],
            marketAddress,
            inputAmount: BigInt(ONE_APT * (i + 1)),
            isSell: false,
            integrator: registrants[i].accountAddress,
            integratorFeeRateBPs: 0,
            minOutputAmount: 1n,
            typeTags: [emojicoin, emojicoinLP],
          });
          return swap.then((swapResponse) => [registerResponse, swapResponse]);
        })
      );
    }

    const responses = await Promise.all(registerAndSwap);
    expect(responses.every(([r1, r2]) => r1.success && r2.success)).toBe(true);
    latestTransactionVersion = Math.max(...responses.map(([_, swap]) => swap.version).map(Number));
    await waitForEmojicoinIndexer(latestTransactionVersion);
    return true;
  });

  it("fetches markets by bump order", async () => {
    const byBumpOrder = await fetchMarkets({
      page: 1,
      sortBy: SortMarketsBy.BumpOrder,
      searchEmojis: [baseVampireEmoji],
    });
    await checkOrder(
      byBumpOrder,
      ({ market: a }, { market: b }) => compareBigInt(b.time, a.time),
      ({ market }, index) => ({ marketID: market.marketID, value: market.time, index })
    );
  });

  it("fetches markets by market cap", async () => {
    const byMarketCap = await fetchMarkets({
      page: 1,
      sortBy: SortMarketsBy.MarketCap,
      searchEmojis: [baseVampireEmoji], // Only include symbols with a `vampire` emoji in them.
    });
    await checkOrder(
      byMarketCap,
      ({ state: a }, { state: b }) =>
        compareBigInt(b.instantaneousStats.marketCap, a.instantaneousStats.marketCap),
      ({ market, state }, index) => ({
        marketID: market.marketID,
        value: state.instantaneousStats.marketCap,
        index,
      })
    );
  });

  it("fetches markets by all time volume", async () => {
    const byAllTimeVolume = await fetchMarkets({
      page: 1,
      sortBy: SortMarketsBy.AllTimeVolume,
      searchEmojis: [baseVampireEmoji],
    });
    await checkOrder(
      byAllTimeVolume,
      ({ state: a }, { state: b }) =>
        compareBigInt(b.cumulativeStats.quoteVolume, a.cumulativeStats.quoteVolume),
      ({ market, state }, index) => ({
        marketID: market.marketID,
        value: state.cumulativeStats.quoteVolume,
        index,
      })
    );
  });

  it("fetches markets by daily volume", async () => {
    const byDailyVolume = await fetchMarkets({
      page: 1,
      sortBy: SortMarketsBy.DailyVolume,
      searchEmojis: [baseVampireEmoji],
    });
    await checkOrder(
      byDailyVolume,
      ({ dailyVolume: a }, { dailyVolume: b }) => compareBigInt(b, a),
      ({ market, dailyVolume }, index) => ({ marketID: market.marketID, value: dailyVolume, index })
    );
  });
});

describe("verifies the sort with unsorted subsets algorithm works", () => {
  it("verifies simple inputs", () => {
    const sortedWithUnsortedSubsets: [bigint, bigint][] = [
      [1n, 100n],
      [3n, 200n],
      [2n, 200n],
    ];
    const strictlySorted: [bigint, bigint][] = sortBigIntPairsReversed(sortedWithUnsortedSubsets);

    const a = sortedWithUnsortedSubsets.map(toSortableResults);
    const b = strictlySorted.map(toSortableResults);
    checkSubsetsEqual(a, b);
  });

  it("verifies the `sortWithUnsortedSubsets` function works as expected", () => {
    const sortedWithUnsortedSubsets: [bigint, bigint][] = [
      // The comment indicates the lowest index in the resulting set with equivalent `value`s.
      [1n, 100n], // 0
      [8n, 100n], // 0
      [7n, 200n], // 2
      [2n, 200n], // 2
      [3n, 200n], // 2
      [5n, 200n], // 2
      [4n, 200n], // 2
      [6n, 200n], // 2
      [10n, 300n], // 8
      [9n, 300n], // 8
      [12n, 1000n], // 10
      [11n, 1100n], // 11
    ];

    const sortable = sortedWithUnsortedSubsets.map(toSortableResults);
    const res = sortWithUnsortedSubsets(sortable);

    const expectedEntries: Array<[bigint, [bigint[], number]]> = [
      [100n, [[1n, 8n], 0]],
      [200n, [[2n, 3n, 4n, 5n, 6n, 7n], 2]],
      [300n, [[9n, 10n], 8]],
      [1000n, [[12n], 10]],
      [1100n, [[11n], 11]],
    ];
    Array.from(res.entries())
      .toSorted((a, b) => {
        // Since marketIDs are unique, we only need to shallow-compare marketIDs for this sort and
        // can assume they will never be equal, and thus we only return 1 or -1.
        const [marketA, marketB] = [a[0], b[0]];
        return marketA > marketB ? 1 : -1;
      })
      .forEach(([value, [setMarketIDs, lowestIndex]], i) => {
        const [expectedValue, [expectedMarketIDs, expectedLowestIndex]] = expectedEntries[i];
        // Sort the set of market IDs for a properly serialized equality check.
        const marketIDs = Array.from(setMarketIDs);
        expect(value).toEqual(expectedValue);
        expect(marketIDs.toSorted().join("")).toEqual(expectedMarketIDs.toSorted().join(""));
        expect(lowestIndex).toEqual(expectedLowestIndex);
      });
  });

  it("verifies with more complex inputs", () => {
    const sortedWithUnsortedSubsets: [bigint, bigint][] = [
      [1n, 100n],
      [8n, 100n],
      [7n, 200n],
      [2n, 200n],
      [3n, 200n],
      [5n, 200n],
      [4n, 200n],
      [6n, 200n],
      [10n, 300n],
      [9n, 300n],
    ];
    // To get a strictly sorted array, put the `value` first, then the market ID.
    const strictlySorted = sortBigIntPairsReversed(sortedWithUnsortedSubsets);

    const a = sortedWithUnsortedSubsets.map(toSortableResults);
    const b = strictlySorted.map(toSortableResults);
    checkSubsetsEqual(a, b);
  });

  it("verifies with even more complex inputs", () => {
    const sortedWithUnsortedSubsets: [bigint, bigint][] = [
      [1n, 100n],
      [8n, 100n],
      [7n, 200n],
      [2n, 200n],
      [3n, 200n],
      [5n, 200n],
      [4n, 200n],
      [6n, 200n],
      [10n, 300n],
      [9n, 300n],
      [12n, 1000n],
      [11n, 1100n],
    ];
    // To get a strictly sorted array, put the `value` first, then the market ID.
    const strictlySorted = sortBigIntPairsReversed(sortedWithUnsortedSubsets);

    const a = sortedWithUnsortedSubsets.map(toSortableResults);
    const b = strictlySorted.map(toSortableResults);
    checkSubsetsEqual(a, b);
  });

  it("throws if the input array is not actually sorted", () => {
    const notSorted: [bigint, bigint][] = [
      [2n, 200n],
      [1n, 100n],
    ];
    const strictlySorted = sortBigIntPairsReversed(notSorted);

    const a = notSorted.map(toSortableResults);
    const b = strictlySorted.map(toSortableResults);
    expect(() => {
      checkSubsetsEqual(a, b);
    }).toThrow();
  });

  it("throws if the complex input array is not actually sorted", () => {
    const notSorted: [bigint, bigint][] = [
      [1n, 100n],
      [8n, 100n],
      [7n, 200n],
      [2n, 200n],
      [3n, 200n],
      [5n, 200n],
      [4n, 200n],
      [6n, 200n],
      [10n, 300n],
      [9n, 300n],
      [11n, 1100n],
      [12n, 1000n],
    ];
    const strictlySorted = sortBigIntPairsReversed(notSorted);

    const a = notSorted.map(toSortableResults);
    const b = strictlySorted.map(toSortableResults);
    expect(() => {
      checkSubsetsEqual(a, b);
    }).toThrow();
  });

  it("throws if the input array is not actually sorted, with complex inputs", () => {
    const notSorted: [bigint, bigint][] = [
      [1n, 100n],
      [0n, 99n],
      [8n, 100n],
      [7n, 200n],
      [2n, 200n],
      [3n, 200n],
      [5n, 200n],
      [4n, 200n],
      [6n, 200n],
      [10n, 300n],
      [9n, 300n],
      [11n, 400n],
      [12n, 399n],
    ];
    const strictlySorted = sortBigIntPairsReversed(notSorted);

    const a = notSorted.map(toSortableResults);
    const b = strictlySorted.map(toSortableResults);
    expect(() => {
      checkSubsetsEqual(a, b);
    }).toThrow();
  });

  it("sorts an array by key *and* value pair in reverse pairs, as expected for the tests", () => {
    const sortedWithUnsortedSubsets = [
      [1n, 100n],
      [0n, 99n],
      [8n, 100n],
      [7n, 200n],
      [2n, 200n],
      [3n, 200n],
      [5n, 200n],
      [4n, 200n],
      [6n, 200n],
      [9n, 300n],
      [10n, 300n],
    ] as Array<[bigint, bigint]>;
    const strictlySorted = sortBigIntPairsReversed(sortedWithUnsortedSubsets);
    expect(strictlySorted).toEqual([
      [0n, 99n],
      [1n, 100n],
      [8n, 100n],
      [2n, 200n],
      [3n, 200n],
      [4n, 200n],
      [5n, 200n],
      [6n, 200n],
      [7n, 200n],
      [9n, 300n],
      [10n, 300n],
    ]);
  });
});
