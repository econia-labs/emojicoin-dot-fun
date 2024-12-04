import { EMOJICOIN_REMAINDER, EMOJICOIN_SUPPLY, ONE_APT_BIGINT } from "../../src/const";
import {
  calculateCirculatingSupply,
  calculateRealReserves,
  fetchCirculatingSupply,
  fetchRealReserves,
  type SymbolEmoji,
  toCoinTypes,
  zip,
} from "../../src";
import { getMarketAddress } from "../../src/emojicoin_dot_fun";
import { getFundedAccounts } from "../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import { getCoinBalanceFromChanges } from "../../src/utils/parse-changes-for-balances";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../src/utils/test";
import { isInBondingCurve } from "../../src/utils/bonding-curve";
import { type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { type SwapEventModel } from "../../src/indexer-v2/types";

jest.setTimeout(30000);

describe("tests the calculation functions for circulating supply and real reserves", () => {
  const registrants = getFundedAccounts("074", "075", "076", "077", "078", "079");
  const marketSymbols: SymbolEmoji[][] = [["🤌"], ["🤌🏻"], ["🤌🏼"], ["🤌🏽"], ["🤌🏾"], ["🤌🏿"]];
  const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: 0 });

  beforeAll(async () => {
    const statuses = await Promise.all(
      zip(registrants, marketSymbols).map(([registrant, emojis]) =>
        emojicoin.register(registrant, emojis).then(({ response }) => response.success)
      )
    );
    expect(statuses.every((v) => v)).toBe(true);
    return true;
  });

  it("checks the circulating supply after a buy and a sell", async () => {
    const idx = 0;
    const [swapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];
    const buyAmount = ONE_APT_BIGINT;
    const coinAddress = getMarketAddress(symbolEmojis);
    const coinType = toCoinTypes(coinAddress).emojicoin;
    const userAddress = swapper.accountAddress;

    const { supplyAfterBuy, userBalance } = await emojicoin
      .buy(swapper, symbolEmojis, buyAmount)
      .then(async ({ response, swap }) => {
        const circulatingSupplyFromFetch = await fetchCirculatingSupply(
          symbolEmojis,
          response.version
        );
        const circulatingSupplyFromTxnResponse = calculateCirculatingSupply(swap.model.state);
        expect(circulatingSupplyFromFetch).toBeDefined();
        expect(circulatingSupplyFromFetch).toEqual(circulatingSupplyFromTxnResponse);
        const balance = getCoinBalanceFromChanges({ response, userAddress, coinType });
        expect(balance).toBeDefined();
        return {
          supplyAfterBuy: circulatingSupplyFromFetch!,
          userBalance: balance!,
        };
      });
    expect(supplyAfterBuy).toEqual(userBalance);

    // Sell 3/4 of the circulating supply (back into the reserves).
    const sellAmount = (userBalance * 3n) / 4n;
    await emojicoin.sell(swapper, symbolEmojis, sellAmount).then(async ({ response, swap }) => {
      const circulatingSupplyFromFetch = await fetchCirculatingSupply(symbolEmojis);
      const circulatingSupplyFromTxnResponse = calculateCirculatingSupply(swap.model.state);
      expect(circulatingSupplyFromFetch).toBeDefined();
      expect(circulatingSupplyFromFetch).toEqual(circulatingSupplyFromTxnResponse);
      const newBalance = getCoinBalanceFromChanges({
        response,
        userAddress: swapper.accountAddress,
        coinType,
      });
      // The user possesses all of the circulating supply.
      expect(newBalance).toEqual(circulatingSupplyFromFetch);
      expect(circulatingSupplyFromFetch).toEqual(supplyAfterBuy - sellAmount);
    });
  });

  it("checks the real reserves upon creation and after exiting the bonding curve", async () => {
    const idx = 1;
    const [swapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];

    await fetchRealReserves(symbolEmojis)
      .then((res) => res!)
      .then(({ base, quote }) => {
        expect(base).toEqual(EMOJICOIN_SUPPLY);
        expect(quote).toEqual(0n);
      });

    await emojicoin.buy(swapper, symbolEmojis, EXACT_TRANSITION_INPUT_AMOUNT).then(({ swap }) => {
      fetchRealReserves(symbolEmojis)
        .then((res) => res!)
        .then(({ base, quote }) => {
          expect(base).toEqual(EMOJICOIN_REMAINDER);
          expect(quote).toEqual(EXACT_TRANSITION_INPUT_AMOUNT);
          expect(isInBondingCurve(swap.model.state)).toBe(false);
        });
    });
  });

  it("checks the real reserves after a user buys & sells post-bonding curve", async () => {
    const idx = 2;
    const [swapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];

    const buyAmountQuote = EXACT_TRANSITION_INPUT_AMOUNT + ONE_APT_BIGINT;
    const sellAmountEmojicoin = ONE_APT_BIGINT * 2n;
    const userAddress = swapper.accountAddress;
    const coinAddress = getMarketAddress(symbolEmojis);
    const coinType = toCoinTypes(coinAddress).emojicoin;

    await emojicoin
      .buy(swapper, symbolEmojis, buyAmountQuote)
      .then(({ response, swap }) =>
        fetchRealReserves(symbolEmojis)
          .then((res) => res!)
          .then(({ base, quote }) => {
            // Expect the base reserves to simply equal the supply minus what the user just bought.
            expect(base).toEqual(EMOJICOIN_SUPPLY - swap.model.swap.netProceeds);
            // The quote reserves are equal to the amount of APT the user just exchanged for base.
            expect(quote).toEqual(EXACT_TRANSITION_INPUT_AMOUNT + ONE_APT_BIGINT);
            expect(isInBondingCurve(swap.model.state)).toBe(false);
            const userBalance = getCoinBalanceFromChanges({ response, userAddress, coinType })!;
            expect(userBalance).toBeDefined();
            expect(userBalance).toEqual(swap.model.swap.netProceeds);
            expect(EMOJICOIN_SUPPLY).toEqual(base + userBalance);
            return base;
          })
      )
      .then((base) =>
        emojicoin.sell(swapper, symbolEmojis, sellAmountEmojicoin).then((res) => ({ ...res, base }))
      )
      .then(({ base: previousBaseReserves, swap }) =>
        fetchRealReserves(symbolEmojis)
          .then((res) => res!)
          .then(({ base, quote }) => {
            // The base volume equals the sell amount- no pool fee incurred for base on a sell.
            expect(swap.model.swap.baseVolume).toEqual(sellAmountEmojicoin);
            // The previous reserves should be the current base minus the amount that was just sold.
            expect(previousBaseReserves).toEqual(base - sellAmountEmojicoin);
            const { netProceeds } = swap.model.swap;
            // The quote reserves now are the previous reserves minus the quote volume/net proceeds.
            expect(netProceeds).toEqual(swap.model.swap.quoteVolume);
            expect(quote).toEqual(EXACT_TRANSITION_INPUT_AMOUNT + ONE_APT_BIGINT - netProceeds);
          })
      );
  });

  it("checks the real reserves after a user buys & sells in the bonding curve", async () => {
    const idx = 3;
    const [swapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];
    const buyAmount = ONE_APT_BIGINT;
    const userAddress = swapper.accountAddress;
    const coinAddress = getMarketAddress(symbolEmojis);
    const coinType = toCoinTypes(coinAddress).emojicoin;

    const { userBalance, baseAfterBuy } = await emojicoin
      .buy(swapper, symbolEmojis, buyAmount)
      .then(async ({ response, swap }) => {
        const realReservesFromFetch = await fetchRealReserves(symbolEmojis, response.version);
        const realReservesFromTxnResponse = calculateRealReserves(swap.model.state);
        expect(isInBondingCurve(swap.model.state)).toBe(true);
        expect(realReservesFromFetch).toBeDefined();
        expect(realReservesFromFetch).toEqual(realReservesFromTxnResponse);
        const { base, quote } = realReservesFromFetch!;
        const balance = getCoinBalanceFromChanges({ response, userAddress, coinType })!;
        expect(balance).toBeDefined();
        // The base reserves are just the total emojicoin supply minus what the user just received.
        expect(base).toEqual(EMOJICOIN_SUPPLY - balance);
        // The quote reserves are equal to however much APT has been deposited to the bonding curve.
        expect(quote).toEqual(buyAmount);
        return {
          baseAfterBuy: base,
          userBalance: balance!,
        };
      });

    // Sell 1/4 of the circulating supply (back into the reserves).
    const sellAmount = userBalance / 4n;
    await emojicoin.sell(swapper, symbolEmojis, sellAmount).then(async ({ response, swap }) => {
      const [circulatingSupplyFromFetch, realReservesFromFetch] = await Promise.all([
        fetchCirculatingSupply(symbolEmojis, response.version).then((res) => res!),
        fetchRealReserves(symbolEmojis).then((res) => res!),
      ]);
      expect(isInBondingCurve(swap.model.state)).toBe(true);
      expect(circulatingSupplyFromFetch).toBeDefined();
      expect(realReservesFromFetch).toBeDefined();
      const realReservesFromTxnResponse = calculateRealReserves(swap.model.state);
      expect(realReservesFromFetch).toEqual(realReservesFromTxnResponse);
      const { base, quote } = realReservesFromFetch;
      // The base reserves increase by how much was just sold.
      expect(base).toEqual(baseAfterBuy + sellAmount);
      expect(swap.event.netProceeds).toEqual(swap.event.quoteVolume);
      // The new quote reserves are equal to the original buy amount minus the net proceeds returned
      // from the swap event.
      expect(quote).toEqual(buyAmount - swap.event.netProceeds);
    });
  });

  const verifyReservesWithBuyBuyBuySell = async ({
    idx,
    amounts,
  }: {
    idx: number;
    amounts: bigint[];
  }) => {
    const [swapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];

    const userAddress = swapper.accountAddress;
    const coinAddress = getMarketAddress(symbolEmojis);
    const coinType = toCoinTypes(coinAddress).emojicoin;

    // Verify the real reserves equals the total supply - circulating supply.
    const verifyCSAndReserves = (response: UserTransactionResponse, swap: SwapEventModel) => {
      const realReserves = calculateRealReserves(swap.state);
      const circulatingSupply = calculateCirculatingSupply(swap.state);
      expect(realReserves.base).toEqual(EMOJICOIN_SUPPLY - circulatingSupply);
      const userBalance = getCoinBalanceFromChanges({ response, userAddress, coinType });
      expect(userBalance).toEqual(circulatingSupply);
    };

    // buy before bonding curve, buy to bonding curve, buy after bonding curve, then sell
    // verify all are expected
    await emojicoin
      .buy(swapper, symbolEmojis, amounts[0])
      .then(({ swap, response }) => {
        verifyCSAndReserves(response, swap.model);
        return emojicoin.buy(swapper, symbolEmojis, amounts[1]);
      })
      .then(({ swap, response }) => {
        verifyCSAndReserves(response, swap.model);
        return emojicoin.buy(swapper, symbolEmojis, amounts[2]);
      })
      .then(({ swap, response }) => {
        verifyCSAndReserves(response, swap.model);
        return emojicoin.sell(swapper, symbolEmojis, amounts[3]);
      })
      .then(({ swap, response }) => verifyCSAndReserves(response, swap.model));
  };

  it("verifies the real reserves are total supply - circulating supply", async () => {
    await verifyReservesWithBuyBuyBuySell({
      idx: 4,
      amounts: [
        EXACT_TRANSITION_INPUT_AMOUNT / 2n, // Buy in the bonding curve only.
        EXACT_TRANSITION_INPUT_AMOUNT / 2n, // Buy exactly to the state transition.
        ONE_APT_BIGINT, // Buy post bonding curve.
        ONE_APT_BIGINT * 2n, // Sell lower than what the top bonding curve price would be at.
      ],
    });
  });

  it("verifies the real reserves are total supply - circulating supply, huge amounts", async () => {
    await verifyReservesWithBuyBuyBuySell({
      idx: 5,
      amounts: [
        (EXACT_TRANSITION_INPUT_AMOUNT * 3n) / 4n, // Buy in the bonding curve only.
        EXACT_TRANSITION_INPUT_AMOUNT / 4n, // Buy exactly to the state transition.
        ONE_APT_BIGINT * 100n, // Buy post bonding curve.
        ONE_APT_BIGINT * 200n, // Sell lower than what the top bonding curve price would be at.
      ],
    });
  });
});
