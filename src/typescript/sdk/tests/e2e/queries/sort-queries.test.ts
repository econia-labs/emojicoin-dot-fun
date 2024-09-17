import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  bigintMax,
  compareBigInt,
  type EmojiName,
  getEmojicoinMarketAddressAndTypeTags,
  getEvents,
  ONE_APT,
  sleep,
  UnitOfTime,
} from "../../../src";
import TestHelpers from "../../utils/helpers";
import { getFundedAccounts } from "../../utils/test-accounts";
import {
  fetchMarketsByAllTimeVolume,
  fetchMarketsByBumpTime,
  fetchMarketsByDailyVolume,
  fetchMarketsByMarketCap,
} from "../../../src/indexer-v2/queries/app/home-page";
import { waitForEmojicoinIndexer, withQueryConfig } from "../../../src/indexer-v2/queries/utils";
import { Swap } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { getAptosClient } from "../../utils";
import { postgrest } from "../../../src/indexer-v2/queries/client";
import { TableName } from "../../../src/indexer-v2/types/snake-case-types";
import { LIMIT } from "../../../src/queries";
import { type MarketStateModel, toMarketState } from "../../../src/indexer-v2/types";

jest.setTimeout(20000);

describe("sorting queries for the sort filters on the home page", () => {
  const { aptos } = getAptosClient();
  const registrants = getFundedAccounts(
    "0x0230e55ee70f31e44e30e7d08bd184ebdf887289170566295b1767a4b9989023",
    "0x0240d2bd361b9819326efec610e680da1fe29c7511c6716f255ab84d7f5e2024",
    "0x025607a6b68b124d0e3692f3bdb9b2a7e50ffc528e3671fa1bff354c2f417025",
    "0x0263fa88299ea8833e0d63d86985354b745672cc048a2a98a078aaf50c7cf026",
    "0x027a138e13934a65add83e2dccd9eab62ba79803cc99bab280d3c16751ff3027",
    "0x028032894d4418be5e1524bb4faa6530a8a5b76e70043976ab12905472f35028",
    "0x029e359a15a2145b9816ccc1913922dca356035cc80a39b1d418139a0ddfe029",
    "0x030bd91be82080eb3c6860eb0a04778795fd93436ea37097dd6000fb4b46a030"
  );

  let latestTransactionVersion: number;

  // In order for these tests to work, *ANY* of the following emojis must *NOT* be used in any other
  // tests as part of a market symbol, because then the query for searching by emoji will return
  // multiple results that were not intended.
  const marketEmojiNames: EmojiName[][] = [
    ["vampire"],
    ["vampire", "drop of blood"],
    ["vampire", "sweat droplets"],
    ["vampire: dark skin tone"],
    ["vampire: light skin tone"],
    ["vampire: medium skin tone"],
    ["vampire: medium-dark skin tone"],
    ["vampire: medium-light skin tone"],
  ];

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

  // Market IDs are in ascending order of registration time, so to filter out markets registered
  // after a query is run, we can just get the latest market ID from that query's results.
  // Then we filter out markets with a market ID greater than that and sort the values in order to
  // compare the expected results with the actual query results.
  const checkOrder = async (
    queryResults: MarketStateModel[],
    sort: (a: MarketStateModel, b: MarketStateModel) => 0 | -1 | 1,
    mapFunction: (arr: MarketStateModel) => [bigint, bigint]
  ) => {
    const allMarketsQuery = () => postgrest.from(TableName.MarketState).select("*");
    const manualQueryResults = await withQueryConfig(allMarketsQuery, toMarketState)({});
    expect(manualQueryResults.length).toBeLessThanOrEqual(LIMIT);

    const latestMarketID = bigintMax(...queryResults.map((res) => res.market.marketID));
    const expected = manualQueryResults
      .filter(({ market }) => market.marketID <= latestMarketID)
      .toSorted(sort)
      .map(mapFunction);
    const results = queryResults.map(mapFunction);
    expect(results.length).toEqual(expected.length);
    for (let i = 0; i < results.length; i += 1) {
      const [expectedMarketID, expectedValue] = expected[i];
      const [marketID, value] = results[i];

      // The value must always be equal.
      expect(expectedValue).toEqual(value);

      // However, due to differences in ordering, we must check if multiple markets have the same
      // value and if so, skip comparing the market IDs at each index until we find a different
      // value. Then, compare the set of market IDs for both.
      if (expectedMarketID !== marketID) {
        const expectedMarketIDs = new Set<bigint>();
        const resultsMarketIDs = new Set<bigint>();
        while (i < results.length) {
          expectedMarketIDs.add(expected[i][0]);
          resultsMarketIDs.add(results[i][0]);
          if (expectedValue === results[i][1]) {
            i += 1;
          } else {
            break;
          }
        }
        expect(expectedMarketIDs).toEqual(resultsMarketIDs);
      }

      // Then, go back to comparing the market IDs + values like normal for the rest of the results.
    }
  };

  it("fetches markets by bump order", async () => {
    const marketsByBumpTime = await fetchMarketsByBumpTime({ page: 1 });
    await checkOrder(
      marketsByBumpTime,
      ({ market: a }, { market: b }) => compareBigInt(b.time, a.time),
      ({ market }) => [market.marketID, market.time]
    );
  });

  it("fetches markets by market cap", async () => {
    const marketsByMarketCap = await fetchMarketsByMarketCap({ page: 1 });
    await checkOrder(
      marketsByMarketCap,
      ({ state: a }, { state: b }) =>
        compareBigInt(b.instantaneousStats.marketCap, a.instantaneousStats.marketCap),
      ({ market, state }) => [market.marketID, state.instantaneousStats.marketCap]
    );
  });

  it("fetches markets by all time volume", async () => {
    const marketsByAllTimeVolume = await fetchMarketsByAllTimeVolume({ page: 1 });
    await checkOrder(
      marketsByAllTimeVolume,
      ({ state: a }, { state: b }) =>
        compareBigInt(b.cumulativeStats.quoteVolume, a.cumulativeStats.quoteVolume),
      ({ market, state }) => [market.marketID, state.cumulativeStats.quoteVolume]
    );
  });

  it("fetches markets by daily volume", async () => {
    const marketsByDailyVolume = await fetchMarketsByDailyVolume({ page: 1 });
    await checkOrder(
      marketsByDailyVolume,
      ({ dailyVolume: a }, { dailyVolume: b }) => compareBigInt(b, a),
      ({ market, dailyVolume }) => [market.marketID, dailyVolume]
    );
  });
});
