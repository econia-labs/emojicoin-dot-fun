import { type EmojiName, getEvents, ONE_APT } from "../../../src";
import TestHelpers, { EXACT_TRANSITION_INPUT_AMOUNT } from "../../utils/helpers";
import { Chat, ProvideLiquidity, Swap } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import {
  fetchChatEvents,
  fetchSwapEvents,
  fetchUserLiquidityPools,
} from "../../../src/indexer-v2/queries";
import { getAptosClient } from "../../utils";
import RowEqualityChecks from "./equality-checks";
import { queryHelper } from "../../../src/indexer-v2/queries/utils";
import { TableName } from "../../../src/indexer-v2/types/json-types";
import { getFundedAccounts } from "../../utils/test-accounts";
import { postgrest } from "../../../src/indexer-v2/queries/client";
import { fetchLatestStateEventForMarket, fetchLiquidityEvents } from ".";

jest.setTimeout(20000);

describe("queries swap_events and returns accurate swap row data", () => {
  const { aptos } = getAptosClient();
  const [registrant, user, swapper, provider] = getFundedAccounts("007", "008", "009", "010");
  const marketEmojiNames: EmojiName[][] = [
    ["scroll"],
    ["selfie"],
    ['Japanese "discount" button'],
    ["adhesive bandage"],
  ];

  it("verifies a valid response for fetching the processor status", async () => {
    expect(process.env.EMOJICOIN_INDEXER_URL).toBeDefined();
    const url = new URL("processor_status", process.env.EMOJICOIN_INDEXER_URL!);
    url.searchParams.set("select", "last_success_version");
    url.searchParams.set("limit", "1");
    const res = await fetch(url);
    const json: [{ last_success_version: number }] = await res.json();
    expect(json).toBeDefined();
    expect(typeof json[0].last_success_version).toBe("number");
  });

  it("performs a simple registerMarket fetch accurately", async () => {
    const { registerResponse: response } = await TestHelpers.registerMarketFromNames({
      registrant,
      emojiNames: marketEmojiNames[0],
    });
    const events = getEvents(response);
    const { marketID } = events.marketRegistrationEvents[0];
    const marketLatestStateRes = await fetchLatestStateEventForMarket({
      marketID,
      minimumVersion: response.version,
    });
    const marketLatestStateRow = marketLatestStateRes[0];

    RowEqualityChecks.MarketLatestState(marketLatestStateRow, response);
  });

  it("performs a simple swap fetch accurately", async () => {
    const { marketAddress, emojicoin, emojicoinLP } = await TestHelpers.registerMarketFromNames({
      registrant: swapper,
      emojiNames: marketEmojiNames[1],
    });
    const res = await Swap.submit({
      aptosConfig: aptos.config,
      swapper,
      marketAddress,
      inputAmount: 90n,
      isSell: false,
      integrator: registrant.accountAddress,
      integratorFeeRateBPs: 0,
      minOutputAmount: 1n,
      typeTags: [emojicoin, emojicoinLP],
    });

    const events = getEvents(res);
    const { marketID } = events.swapEvents[0];

    const queryRes = await fetchSwapEvents({ marketID, minimumVersion: res.version, pageSize: 1 });
    const row = queryRes[0];

    RowEqualityChecks.Swap(row, res);
  });

  it("performs a simple chat fetch accurately", async () => {
    const { marketAddress, emojicoin, emojicoinLP, emojis } =
      await TestHelpers.registerMarketFromNames({
        registrant: user,
        emojiNames: marketEmojiNames[2],
      });

    const res = await Chat.submit({
      aptosConfig: aptos.config,
      user,
      marketAddress,
      emojiBytes: emojis.map((e) => e.hex),
      emojiIndicesSequence: new Uint8Array(Array.from({ length: emojis.length }, (_, i) => i)),
      typeTags: [emojicoin, emojicoinLP],
    });

    const events = getEvents(res);
    const { marketID } = events.chatEvents[0];

    const queryRes = await fetchChatEvents({ marketID, minimumVersion: res.version, pageSize: 1 });
    const row = queryRes[0];

    RowEqualityChecks.Chat(row, res);
  });

  it("performs a simple liquidity fetch accurately", async () => {
    const { marketAddress, emojicoin, emojicoinLP } = await TestHelpers.registerMarketFromNames({
      registrant: provider,
      emojiNames: marketEmojiNames[3],
    });

    const res = await Swap.submit({
      aptosConfig: aptos.config,
      swapper: provider,
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
      provider,
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

    const poolQueryRes = (await fetchLatestStateEventForMarket({ marketID })).at(0);
    const foundMarketInLatestStateTable = poolQueryRes?.market.marketID === marketID;
    const marketsWithPools = await queryHelper(
      () =>
        postgrest
          .from(TableName.MarketLatestStateEvent)
          .select("market_id")
          .eq("in_bonding_curve", false)
          .eq("market_id", marketID),
      ({ market_id }) => ({ marketID: BigInt(market_id as string) })
    )({ marketID });

    const foundInMarketsWithPools = marketsWithPools.find((m) => m.marketID === marketID);

    const userPoolQueryRes = await fetchUserLiquidityPools({
      provider,
      minimumVersion: res.version,
    });

    const foundInUserPools = userPoolQueryRes.find((row) => row.market.marketID === marketID);
    const row = liquidityEventsQueryRes[0];

    RowEqualityChecks.Liquidity(row, liquidityRes);
    expect(foundMarketInLatestStateTable).toBe(true);
    expect(foundInMarketsWithPools).toBeTruthy();
    expect(foundInUserPools).toBeTruthy();
  });
});
