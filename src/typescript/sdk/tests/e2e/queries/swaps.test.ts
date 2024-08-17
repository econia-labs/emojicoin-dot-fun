import { Account, type Aptos } from "@aptos-labs/ts-sdk";
import { type AnyEmojiName, getEvents } from "../../../src";
import { registerMarketTestHelper } from "../../utils/helpers";
import { SwapWithRewards } from "../../../src/emojicoin_dot_fun/emojicoin-dot-fun";
import { fetchSwaps } from "../../../src/indexer-v2/queries";
import { compareSwapRowToResponse } from "./equality-checks";

describe("queries swap_events and returns accurate swap row data", () => {
  const registrant = Account.generate();
  const emojiNames: Array<Array<AnyEmojiName>> = [
    ["pile of poo", "axe"],
    ["pill"],
    ["3rd place medal"],
  ];
  let aptos: Aptos;
  const markets = new Array<Awaited<ReturnType<typeof registerMarketTestHelper>>>();

  beforeAll(async () => {
    const promises = emojiNames.map((names) =>
      registerMarketTestHelper({
        emojiNames: names,
        registrant,
      })
    );

    const results = await Promise.all(promises);
    markets.push(...results);

    expect(
      results.reduce(
        // Undefined registerResponse means the registration already exists, so we
        // consider it a success.
        (acc, { registerResponse }) => acc && (registerResponse?.success ?? true),
        true
      )
    ).toBe(true);

    return true;
  });

  it("performs a simple fetch accurately", async () => {
    const { marketAddress, emojicoin, emojicoinLP } = markets[0];
    const res = await SwapWithRewards.submit({
      aptosConfig: aptos.config,
      swapper: registrant,
      marketAddress,
      inputAmount: 100n,
      isSell: false,
      typeTags: [emojicoin, emojicoinLP],
      minOutputAmount: 1n,
    });

    const events = getEvents(res);
    const { marketID } = events.swapEvents[0];

    const queryRes = await fetchSwaps({ marketID });
    expect(queryRes.length).toBe(1);
    const row = queryRes[0];

    expect(compareSwapRowToResponse(row, res)).toBe(true);
  });
});
