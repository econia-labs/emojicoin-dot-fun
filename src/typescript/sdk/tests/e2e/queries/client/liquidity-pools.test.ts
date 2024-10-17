/* eslint-disable no-await-in-loop */

import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { maxBigInt, ONE_APT, toSequenceNumberOptions, type SymbolEmoji } from "../../../../src";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../../../src/utils/test/helpers";
import { getFundedAccounts } from "../../../../src/utils/test/test-accounts";
import { waitForEmojicoinIndexer } from "../../../../src/indexer-v2/queries/utils";
import { fetchMarkets, fetchUserLiquidityPools } from "../../../../src/indexer-v2/queries";
import { LIMIT } from "../../../../src/queries";
import { EmojicoinClient } from "../../../../src/client/emojicoin-client";

jest.setTimeout(20000);

describe("queries for liquidity pools with the emojicoin client", () => {
  const registrants = getFundedAccounts("046", "047");
  const emojicoin = new EmojicoinClient();

  it("queries a user's liquidity pools with the rpc function call", async () => {
    const registrant = registrants[0];
    const [swapper, provider] = [registrant, registrant];

    const symbols: SymbolEmoji[][] = [["🏄"], ["🏄🏻"], ["🏄🏼"], ["🏄🏽"], ["🏄🏾"], ["🏄🏿"]];

    const toSequenceNumberAndMaxGas = (n: number) => ({
      options: {
        ...toSequenceNumberOptions(n).options,
        maxGasAmount: ONE_APT / 100,
        gasUnitPrice: 100,
      },
    });

    const responses: UserTransactionResponse[] = await Promise.all(
      symbols.map((symbol, i) =>
        emojicoin
          .register(registrant, symbol, toSequenceNumberAndMaxGas(i * 3))
          .then(() =>
            emojicoin
              .buy(swapper, symbol, EXACT_TRANSITION_INPUT_AMOUNT)
              .then(() =>
                emojicoin.liquidity
                  .provide(provider, symbol, 1000n)
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
    const emojis: SymbolEmoji[] = ["🌊", "💦"];
    await emojicoin.register(registrant, emojis);
    const res = await emojicoin
      .buy(swapper, emojis, EXACT_TRANSITION_INPUT_AMOUNT)
      .then(({ response }) =>
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
