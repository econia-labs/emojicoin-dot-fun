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
import { deriveMarketAddress } from "../../src/emojicoin_dot_fun";
import { getFundedAccounts } from "../../src/utils/test/test-accounts";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import { getCoinBalanceFromChanges } from "../../src/utils/parse-changes-for-balances";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../../src/utils/test";
import { isInBondingCurve } from "../../src/utils/bonding-curve";

jest.setTimeout(30000);

describe("tests the calculation functions for circulating supply and real reserves", () => {
  const registrants = getFundedAccounts("074", "075", "076");
  const marketSymbols: SymbolEmoji[][] = [["🎁"], ["🪨"], ["🏝️"]];
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
    const coinAddress = deriveMarketAddress(symbolEmojis);
    const coinType = toCoinTypes(coinAddress).emojicoin;

    const { supplyAfterBuy, userBalance } = await emojicoin
      .buy(swapper, symbolEmojis, ONE_APT_BIGINT)
      .then(async ({ response, swap }) => {
        const circulatingSupplyFromFetch = await fetchCirculatingSupply(
          symbolEmojis,
          response.version
        );
        const circulatingSupplyFromTxnResponse = calculateCirculatingSupply(swap.model.state);
        expect(circulatingSupplyFromFetch).not.toBeNull();
        expect(circulatingSupplyFromFetch).toEqual(circulatingSupplyFromTxnResponse);
        const balance = getCoinBalanceFromChanges({
          response,
          userAddress: swapper.accountAddress,
          coinType,
        });
        expect(balance).toBeDefined();
        return {
          supplyAfterBuy: circulatingSupplyFromFetch!,
          userBalance: balance!,
        };
      });
    expect(supplyAfterBuy).toEqual(userBalance);

    // Sell 3/4 of the circulating supply (back into the reserves).
    const sellAmount = (userBalance * 3n) / 4n;
    emojicoin.sell(swapper, symbolEmojis, sellAmount).then(async ({ response, swap }) => {
      const circulatingSupplyFromFetch = await fetchCirculatingSupply(symbolEmojis);
      const circulatingSupplyFromTxnResponse = calculateCirculatingSupply(swap.model.state);
      expect(circulatingSupplyFromFetch).not.toBeNull();
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

  it("checks the real reserves before a swap and after an exact transition", async () => {
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

  it("checks the real reserves after a buy and a sell", async () => {
    const idx = 2;
    const [swapper, symbolEmojis] = [registrants[idx], marketSymbols[idx]];
    const coinAddress = deriveMarketAddress(symbolEmojis);
    const coinType = toCoinTypes(coinAddress).emojicoin;

    const buyAmount = ONE_APT_BIGINT;
    const { userBalance, baseAfterBuy } = await emojicoin
      .buy(swapper, symbolEmojis, buyAmount)
      .then(async ({ response, swap }) => {
        const realReservesFromFetch = await fetchRealReserves(symbolEmojis, response.version);
        const realReservesFromTxnResponse = calculateRealReserves(swap.model.state);
        expect(isInBondingCurve(swap.model.state)).toBe(true);
        expect(realReservesFromFetch).not.toBeNull();
        expect(realReservesFromFetch).toEqual(realReservesFromTxnResponse);
        const { base, quote } = realReservesFromFetch!;
        const balance = getCoinBalanceFromChanges({
          response,
          userAddress: swapper.accountAddress,
          coinType,
        })!;
        // The base reserves are just the total emojicoin supply minus what the user just received.
        expect(base).toEqual(EMOJICOIN_SUPPLY - balance);
        // The quote reserves are equal to however much APT has been deposited to the bonding curve.
        expect(quote).toEqual(buyAmount);
        expect(balance).toBeDefined();
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
      expect(circulatingSupplyFromFetch).not.toBeNull();
      expect(realReservesFromFetch).not.toBeNull();
      const realReservesFromTxnResponse = calculateRealReserves(swap.model.state);
      expect(realReservesFromFetch).toEqual(realReservesFromTxnResponse);
      const { base, quote } = realReservesFromFetch;
      // The base emojicoin in the reserves is exactly the amount that was just sold.
      expect(base).toEqual(baseAfterBuy + sellAmount);
      // The new quote reserves are equal to the original buy amount minus the net proceeds returned
      // from the swap event.
      expect(swap.event.netProceeds).toEqual(swap.event.quoteVolume);
      expect(quote).toEqual(buyAmount - swap.event.netProceeds);
    });
  });
});
