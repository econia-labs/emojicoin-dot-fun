// 1. basic lp coin balance functionality (anything that generates a LiquidityEvent)
//    - provide
//    - remove
// 2. lp coin balance functionality for each of the edge cases (leading zeros for all):
//    - market address
//     - owner address
// - FA metadata address
// - FA primary store address

import { Account } from "@aptos-labs/ts-sdk";
import { SymbolEmoji } from "../../../src";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";
import {
  fetchMarkets,
  fetchMarketState,
  fetchMarketStateByAddress,
  waitForEmojicoinIndexer,
} from "../../../src/indexer-v2";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../utils";
import { getFundedAccount, getFundedAccounts } from "../../utils/test-accounts";

jest.setTimeout(60000);

describe("tests to ensure the emojicoin indexer properly records emojicoin lp coin balances", () => {
  // For the first couple basic tests.
  const basicRegistrant = getFundedAccount("088");
  const basicSymbol: SymbolEmoji[] = ["🫴"];
  const emojicoin = new EmojicoinClient();
  const { marketAddress, typeTags } = emojicoin.utils.getEmojicoinInfo(symbol);

  async function buyToBondingCurve(registrant: Account, symbol: SymbolEmoji[]) {
    await emojicoin
      .register(registrant, symbol)
      .then(() => emojicoin.buy(registrant, symbol, EXACT_TRANSITION_INPUT_AMOUNT))
      .then((res) => waitForEmojicoinIndexer(res.response.version));

    const res = await fetchMarketStateByAddress({ address: marketAddress.toString() });
    expect(res).not.toBeNull();
    expect(res!.inBondingCurve).toBe(false);
    return res;
  }

  beforeAll(async () => {
    await buyToBondingCurve(basicRegistrant, basicSymbol);
  });

  it("works with a provide liquidity event", () => {

  });

  it("works with a remove liquidity event", () => {});

  it("works with a market address that has a leading zero");
});
