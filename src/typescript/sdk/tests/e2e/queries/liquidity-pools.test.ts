/* eslint-disable no-await-in-loop */

import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import {
  INTEGRATOR_ADDRESS,
  maxBigInt,
  toSequenceNumberOptions,
  type MarketSymbolEmojis,
} from "../../../src";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../utils/helpers";
import { getFundedAccounts } from "../../utils/test-accounts";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2/queries/utils";
import { fetchMarkets, fetchUserLiquidityPools } from "../../../src/indexer-v2/queries";
import { LIMIT } from "../../../src/queries";
import { EmojicoinClient } from "../../../src/client/emojicoin-client";

jest.setTimeout(20000);

describe("queries for liquidity pools", () => {
  const registrants = getFundedAccounts("038", "039");
  const emojicoin = new EmojicoinClient();

  const REGISTRATION_ARGS = {
    integrator: INTEGRATOR_ADDRESS,
  };

  const SWAP_ARGS = {
    inputAmount: EXACT_TRANSITION_INPUT_AMOUNT,
    minOutputAmount: 1n,
    integrator: INTEGRATOR_ADDRESS,
    integratorFeeRateBPs: 0,
  };

  const LIQUIDITY_ARGS = {
    quoteAmount: 1000n,
    minLpCoinsOut: 1n,
  };

  it("queries a user's liquidity pools with the rpc function call", async () => {
    const registrant = registrants[0];
    const [swapper, provider] = [registrant, registrant];

    const symbols = (["🏊", "🏊🏻", "🏊🏼", "🏊🏽", "🏊🏾", "🏊🏿"] as MarketSymbolEmojis).map((e) =>
      Array.from([e])
    );

    const responses: UserTransactionResponse[] = await Promise.all(
      symbols.map((symbol, i) =>
        emojicoin
          .register(registrant, symbol, REGISTRATION_ARGS, toSequenceNumberOptions(i * 3))
          .then(() =>
            emojicoin
              .buy(swapper, symbol, SWAP_ARGS)
              .then(() =>
                emojicoin.liquidity
                  .provide(provider, symbol, LIQUIDITY_ARGS)
                  .then(({ response }) => response)
              )
          )
      )
    );

    const highestVersion = maxBigInt(...responses.map(({ version }) => version));
    await waitForEmojicoinIndexer(highestVersion);

    const res = await fetchUserLiquidityPools({ provider: provider.accountAddress });
    expect(res.length).toEqual(symbols.length);
    const symbolsFromQuery = new Set(res.map(({ market }) => market.symbolData.symbol));
    const symbolsFromJoinedStrings = new Set(res.map(({ market }) => market.symbolEmojis.join("")));
    expect(symbolsFromQuery).toEqual(symbolsFromJoinedStrings);
    expect(symbolsFromQuery.size).toEqual(symbolsFromJoinedStrings.size);
    expect(symbolsFromQuery.size).toEqual(symbols.length);
    expect(symbolsFromQuery).toEqual(new Set(symbols.map((symbol) => symbol.join(""))));
  });

  it("queries all existing liquidity pools", async () => {
    const registrant = registrants[1];
    const swapper = registrant;
    const emojis: MarketSymbolEmojis = ["🌊"];
    await emojicoin.register(registrant, emojis, REGISTRATION_ARGS);
    const res = await emojicoin.buy(swapper, emojis, SWAP_ARGS).then(({ response }) =>
      waitForEmojicoinIndexer(response.version).then(() =>
        fetchMarkets({
          inBondingCurve: false,
          pageSize: LIMIT,
        })
      )
    );
    // If the result is not less than `LIMIT`, this test needs to be updated to paginate results.
    expect(res.length).toBeLessThan(LIMIT);

    const symbol = emojis.join("");
    const poolSymbols = res.map(({ market }) => market.symbolData.symbol);
    const poolSet = new Set(poolSymbols);
    expect(poolSet.has(symbol)).toBe(true);
  });
});
