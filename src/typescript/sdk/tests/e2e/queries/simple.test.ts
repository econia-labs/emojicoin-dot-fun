import { Account } from "@aptos-labs/ts-sdk";
import { generateRandomSymbol, getEvents, ONE_APT } from "../../../src";
import { EXACT_TRANSITION_INPUT_AMOUNT, registerMarketTestHelper } from "../../utils/helpers";
import {
  Chat,
  ProvideLiquidity,
  RegisterMarket,
  Swap,
  SwapWithRewards,
} from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import {
  fetchChats,
  fetchLiquidityEvents,
  fetchMarketLatestStateEvents,
  fetchSwaps,
  fetchUserLiquidityPools,
} from "../../../src/indexer-v2/queries";
import { fundAccountFast, getAptosClient } from "../../utils";
import RowEqualityChecks from "./equality-checks";
import { withQueryConfig } from "../../../src/indexer-v2/queries/utils";
import { TableName } from "../../../src/indexer-v2/types/snake-case-types";
import { postgrest } from "../../../src/indexer-v2/queries/base";
import { toMarketLatestStateEventModel } from "../../../src/indexer-v2/types";

const NUM_TESTS = 4;

describe("queries swap_events and returns accurate swap row data", () => {
  let registrant = Account.generate();
  while (registrant.accountAddress.toString().at(0) !== "0") {
    registrant = Account.generate();
  }
  const { aptos } = getAptosClient();
  const markets = new Array<Awaited<ReturnType<typeof registerMarketTestHelper>>>();

  beforeAll(async () => {
    // Fund the account with 100 APT.
    await fundAccountFast(aptos, registrant, ONE_APT * 100);

    /* eslint-disable-next-line no-await-in-loop */
    for (let i = 0; i < NUM_TESTS; i++) {
      markets.push(await registerMarketTestHelper({ registrant }));
    }

    // Check that all the markets were registered successfully.
    const res = markets.reduce(
      (acc, { registerResponse }) => acc && registerResponse.success,
      true
    );
    return res;
  });

  it("performs a simple registerMarket fetch accurately", async () => {
    const emojis = generateRandomSymbol().emojis.map((e) => e.hex);
    const res = await RegisterMarket.submit({
      aptosConfig: aptos.config,
      registrant,
      emojis,
      integrator: registrant.accountAddress,
    });

    const events = getEvents(res);
    const { marketID } = events.marketRegistrationEvents[0];

    const marketLatestStateRes = await fetchMarketLatestStateEvents({
      marketID,
      minimumVersion: res.version,
    });
    const marketLatestStateRow = marketLatestStateRes[0];

    RowEqualityChecks.marketLatestStateRow(marketLatestStateRow, res);
  });

  it("performs a simple swap fetch accurately", async () => {
    const market = markets.pop();
    if (!market) {
      throw new Error("There should be enough markets for each test to pop off.");
    }
    const { marketAddress, emojicoin, emojicoinLP } = market;
    const res = await SwapWithRewards.submit({
      aptosConfig: aptos.config,
      swapper: registrant,
      marketAddress,
      inputAmount: 90n,
      isSell: false,
      typeTags: [emojicoin, emojicoinLP],
      minOutputAmount: 1n,
    });

    const events = getEvents(res);
    const { marketID } = events.swapEvents[0];

    const queryRes = await fetchSwaps({ marketID, minimumVersion: res.version, limit: 1 });
    const row = queryRes[0];

    RowEqualityChecks.swapRow(row, res);
  });

  it("performs a simple chat fetch accurately", async () => {
    const market = markets.pop();
    if (!market) {
      throw new Error("There should be enough markets for each test to pop off.");
    }

    const { marketAddress, emojicoin, emojicoinLP, emojis } = market;
    const res = await Chat.submit({
      aptosConfig: aptos.config,
      user: registrant,
      marketAddress,
      emojiBytes: emojis.map((e) => e.hex),
      emojiIndicesSequence: new Uint8Array(Array.from({ length: emojis.length }, (_, i) => i)),
      typeTags: [emojicoin, emojicoinLP],
    });

    const events = getEvents(res);
    const { marketID } = events.chatEvents[0];

    const queryRes = await fetchChats({ marketID, minimumVersion: res.version, limit: 1 });
    const row = queryRes[0];

    RowEqualityChecks.chatRow(row, res);
  });

  it("performs a simple liquidity fetch accurately", async () => {
    const market = markets.pop();
    if (!market) {
      throw new Error("There should be enough markets for each test to pop off.");
    }

    // We need to trigger a state transition. Buy exactly the right amount.
    const { marketAddress, emojicoin, emojicoinLP } = market;
    const res = await Swap.submit({
      aptosConfig: aptos.config,
      swapper: registrant,
      marketAddress,
      inputAmount: EXACT_TRANSITION_INPUT_AMOUNT,
      isSell: false,
      integrator: registrant.accountAddress,
      integratorFeeRateBPs: 0,
      typeTags: [emojicoin, emojicoinLP],
      minOutputAmount: 1n,
    });

    const events = getEvents(res);
    const swapEvent = events.swapEvents[0];
    const { marketID } = swapEvent;
    const transitioned = swapEvent.startsInBondingCurve && swapEvent.resultsInStateTransition;
    if (!transitioned) {
      throw new Error("The swap buy did not trigger a state transition.");
    }

    const liquidityRes = await ProvideLiquidity.submit({
      aptosConfig: aptos.config,
      provider: registrant,
      marketAddress,
      quoteAmount: ONE_APT,
      minLpCoinsOut: 1n,
      typeTags: [emojicoin, emojicoinLP],
    });

    const liquidityEvent = getEvents(liquidityRes).liquidityEvents.at(0);
    if (!liquidityEvent) {
      throw new Error("No liquidity event found.");
    }

    const liquidityEventsQueryRes = await fetchLiquidityEvents({
      marketID,
      marketNonce: liquidityEvent.marketNonce,
      // Note we must wait for the liquidity event to be indexed.
      // We very likely only need to wait for the first one.
      minimumVersion: liquidityRes.version,
    });

    const poolQueryRes = (await fetchMarketLatestStateEvents({ marketID })).at(0);
    const foundMarketInLatestStateTable = poolQueryRes?.market.marketID === marketID;
    const marketsWithPools = await withQueryConfig(
      () =>
        postgrest
          .from(TableName.MarketLatestStateEvent)
          .select("market_id")
          .eq("in_bonding_curve", false)
          .eq("market_id", marketID),
      ({ market_id }) => ({ marketID: BigInt(market_id) }),
      TableName.MarketLatestStateEvent
    )({ marketID });

    const foundInMarketsWithPools = marketsWithPools.find((m) => m.marketID === marketID);

    const userPoolQueryRes = await fetchUserLiquidityPools({
      provider: registrant.accountAddress,
      minimumVersion: res.version,
    });

    const foundInUserPools = userPoolQueryRes.find((row) => row.marketID === marketID);

    const row = liquidityEventsQueryRes[0];

    RowEqualityChecks.liquidityRow(row, liquidityRes);
    expect(foundMarketInLatestStateTable).toBe(true);
    expect(foundInMarketsWithPools).toBeTruthy();
    expect(foundInUserPools).toBeTruthy();
  });
});
