/* eslint-disable no-await-in-loop */

import type { TypeTag, UserTransactionResponse } from "@aptos-labs/ts-sdk";

import { ProvideLiquidity, Swap } from "@/move-modules/emojicoin-dot-fun";

import { maxBigInt, type SymbolEmoji } from "../../../src";
import { LIMIT } from "../../../src/indexer-v2/const";
import { fetchMarkets, fetchUserLiquidityPools } from "../../../src/indexer-v2/queries";
import { waitForEmojicoinIndexer } from "../../../src/indexer-v2/queries/utils";
import { getAptosClient } from "../../utils";
import { EXACT_TRANSITION_INPUT_AMOUNT, registerMarketHelper } from "../../utils/helpers";
import { getFundedAccounts } from "../../utils/test-accounts";

jest.setTimeout(20000);

describe("queries for liquidity pools", () => {
  const { config: aptosConfig } = getAptosClient();
  const registrants = getFundedAccounts("038", "039");
  const inputAmount = EXACT_TRANSITION_INPUT_AMOUNT;
  const integrator = registrants[0].accountAddress;

  it("queries a user's liquidity pools with the rpc function call", async () => {
    const registrant = registrants[0];
    const [swapper, provider] = [registrant, registrant];

    const symbols = (["🏊", "🏊🏻", "🏊🏼", "🏊🏽", "🏊🏾", "🏊🏿"] as SymbolEmoji[]).map((e) =>
      Array.from([e])
    );

    const markets: Awaited<ReturnType<typeof registerMarketHelper>>[] = [];
    for (const emojis of symbols) {
      markets.push(
        await registerMarketHelper({
          registrant,
          emojis,
        })
      );
    }

    const responses: UserTransactionResponse[] = [];
    for (const { marketAddress, emojicoin, emojicoinLP } of markets) {
      const typeTags = [emojicoin, emojicoinLP] as [TypeTag, TypeTag];
      await Swap.submit({
        aptosConfig,
        swapper,
        inputAmount,
        marketAddress,
        isSell: false,
        minOutputAmount: 1n,
        integrator,
        integratorFeeRateBPs: 0,
        typeTags,
      });
      const res = await ProvideLiquidity.submit({
        aptosConfig,
        provider,
        marketAddress,
        quoteAmount: 1000n,
        minLpCoinsOut: 1n,
        typeTags,
      });
      responses.push(res);
    }

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
    const emojis: SymbolEmoji[] = ["🌊"];
    const { marketAddress, emojicoin, emojicoinLP } = await registerMarketHelper({
      registrant,
      emojis,
    });
    const { version } = await Swap.submit({
      aptosConfig,
      swapper,
      inputAmount,
      marketAddress,
      isSell: false,
      minOutputAmount: 1n,
      integrator,
      integratorFeeRateBPs: 0,
      typeTags: [emojicoin, emojicoinLP],
    });

    await waitForEmojicoinIndexer(version);
    const res = await fetchMarkets({
      inBondingCurve: false,
      pageSize: LIMIT,
    });

    // If the result is not less than `LIMIT`, this test needs to be updated to paginate results.
    expect(res.length).toBeLessThan(LIMIT);

    const symbol = emojis.join("");
    const poolSymbols = res.map(({ market }) => market.symbolData.symbol);
    const poolSet = new Set(poolSymbols);
    expect(poolSet.has(symbol)).toBe(true);
  });
});
