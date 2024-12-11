import {
  APTOS_COIN_TYPE_TAG,
  calculateCurvePrice,
  getCoinBalanceFromChanges,
  getMarketAddress,
  getMarketResource,
  maxBigInt,
  ONE_APT_BIGINT,
  PreciseBig,
  type SymbolEmoji,
  toCoinTypes,
  zip,
} from "../../src";
import { getFundedAccounts } from "../utils/test-accounts";
import { EmojicoinClient } from "../../src/client/emojicoin-client";
import { waitForEmojicoinIndexer } from "../../src/indexer-v2";
import { type Account } from "@aptos-labs/ts-sdk";
import { EXACT_TRANSITION_INPUT_AMOUNT } from "../utils";
import Big from "big.js";

jest.setTimeout(30000);

const originalDP = Big.DP;

// Expect the geometric mean from two points on an AMM curve to be at least 99.5% accurate.
const accuracy = 0.995;

/**
 * NOTE:
 *   These tests merely serve to illustrate an example for how price travels across each curve.
 *   The accuracy of the `calculateCurvePrice` function is always 100% accurate, since it's an
 *   instantaneous evaluation of a curve's price based on its reserves.
 *
 *   However, in order to calculate the price between two swaps, we must use the geometric mean,
 *   which is why the resulting expected value is very slightly inaccurate.
 */
describe(`curve price calculations w/ geometric mean, at least ${accuracy * 100}% accurate`, () => {
  const registrants = getFundedAccounts("080", "081", "082", "083");
  const marketSymbols: SymbolEmoji[][] = [["💵"], ["💶"], ["💷"], ["💴"]];
  const emojicoin = new EmojicoinClient({ integratorFeeRateBPs: 0 });
  const { aptos } = emojicoin;

  beforeAll(async () => {
    const successAndVersions = await Promise.all(
      zip(registrants, marketSymbols).map(([registrant, emojis]) =>
        emojicoin.register(registrant, emojis).then(({ response }) => ({
          success: response.success,
          version: BigInt(response.version),
        }))
      )
    );
    const statuses = successAndVersions.map(({ success }) => success);
    const versions = successAndVersions.map(({ version }) => version);
    expect(statuses.every((v) => v)).toBe(true);
    await waitForEmojicoinIndexer(maxBigInt(...versions));
    return true;
  });

  it("verifies that the normal big constructor isn't affected by more precise decimals", () => {
    expect(Big.DP).toEqual(originalDP);
    expect(Big.DP).not.toEqual(PreciseBig.DP);
    const [fracNumerator, fracDenominator] = [2, 3];
    // We're calculating 2/3 aka 1.666666666...7 and checking the number of 6s.
    expect(Big(fracNumerator).div(fracDenominator).toString()).toEqual(
      `0.${"6".repeat(originalDP - 1)}7`
    );
    expect(PreciseBig(fracNumerator).div(fracDenominator).toString()).toEqual(
      `0.${"6".repeat(PreciseBig.DP - 1)}7`
    );
  });

  /**
   * Verifies price calculations for an emojicoin trade and returns final balances.
   * Uses a two-point comparison on the curve: pre-trade price and post-trade price.
   * The average execution price should equal the slope of the secant line between these points.
   *
   * 1. Get the price prior to any activity. This is the first point on the curve.
   * 2. Trade the coin and get the average execution price.
   * 3. Get the price post activity. This is the second point on the curve.
   * 4. The avg execution price should be equal to the slope of the secant line that forms the two
   *    points on the curve; i.e., avg execution price === (post_price + pre_price) / 2
   *
   * @param registrant - Account performing the trade
   * @param inputAmount - Amount to trade (positive for buy, negative for sell)
   * @param symbolEmojis - Array of emoji symbols for the market
   * @returns Object containing final APT and emojicoin balances
   * @returns {bigint} apt - Final APT balance
   * @returns {bigint} emoji - Final emojicoin balance
   */
  const checkPrices = async (
    registrant: Account,
    inputAmount: bigint,
    symbolEmojis: SymbolEmoji[]
  ): Promise<{
    apt: bigint;
    emoji: bigint;
  }> => {
    const marketAddress = getMarketAddress(symbolEmojis);
    const coinTypes = toCoinTypes(marketAddress);
    return await getMarketResource({ aptos, marketAddress })
      .then((market) => calculateCurvePrice(market))
      .then((beforePrice) =>
        (inputAmount >= 0 ? emojicoin.buy : emojicoin.sell)(
          registrant,
          symbolEmojis,
          inputAmount < 0 ? inputAmount * -1n : inputAmount
        ).then(({ swap, response }) => ({
          beforePrice,
          swap,
          response,
        }))
      )
      .then(({ beforePrice, swap, response }) => ({
        before: beforePrice,
        average: PreciseBig(swap.event.quoteVolume.toString()).div(
          swap.event.baseVolume.toString()
        ),
        after: calculateCurvePrice(swap.model.state),
        response,
        swap,
      }))
      .then(({ before, average, after, response }) => {
        const expectedAverage = average;
        const receivedAverage = before.mul(after).sqrt();
        const variance = expectedAverage.div(receivedAverage);
        const normalizedVariance = PreciseBig(1).minus(variance).abs();
        // Expect it to be 99.5% accurate. It is impossible to get it perfect, since the Move
        // contract rounds the intermediate representation at various points.
        // Note that larger trades will result in a larger variance.
        expect(normalizedVariance.lte(1 - accuracy)).toBe(true);
        const apt = getCoinBalanceFromChanges({
          response,
          userAddress: registrant.accountAddress,
          coinType: APTOS_COIN_TYPE_TAG,
        })!;
        const emoji = getCoinBalanceFromChanges({
          response,
          userAddress: registrant.accountAddress,
          coinType: coinTypes.emojicoin,
        })!;
        expect(apt).toBeDefined();
        expect(emoji).toBeDefined();
        return {
          apt,
          emoji,
        };
      });
  };
  const checkBuy = async (registrant: Account, inputAmount: bigint, symbolEmojis: SymbolEmoji[]) =>
    checkPrices(registrant, inputAmount, symbolEmojis);

  const checkSell = async (registrant: Account, inputAmount: bigint, symbolEmojis: SymbolEmoji[]) =>
    checkPrices(registrant, inputAmount * -1n, symbolEmojis);

  it("calculates the price in the bonding curve for both a buy & a sell)", async () => {
    const idx = 0;
    const [swapper, symbol] = [registrants[idx], marketSymbols[idx]];
    const balances = await checkBuy(swapper, ONE_APT_BIGINT, symbol);
    await checkSell(swapper, balances.emoji, symbol);
  });
  it("calculates the price at an exact state transition for a buy & then a sell", async () => {
    const idx = 1;
    const [swapper, symbol] = [registrants[idx], marketSymbols[idx]];
    const balances = await checkBuy(swapper, EXACT_TRANSITION_INPUT_AMOUNT, symbol);
    await checkSell(swapper, balances.emoji / 10n, symbol);
  });
  it("calculates the price post bonding curve for both a buy & a sell", async () => {
    const idx = 2;
    const [swapper, symbol] = [registrants[idx], marketSymbols[idx]];
    const inputAmount = EXACT_TRANSITION_INPUT_AMOUNT + ONE_APT_BIGINT;
    const balances = await checkBuy(swapper, inputAmount, symbol);
    await checkSell(swapper, balances.emoji / 2n, symbol);
  });
  it("calculates the price post bonding curve for both a buy & a small sell", async () => {
    const idx = 3;
    const [swapper, symbol] = [registrants[idx], marketSymbols[idx]];
    const inputAmount = EXACT_TRANSITION_INPUT_AMOUNT + ONE_APT_BIGINT;
    const balances = await checkBuy(swapper, inputAmount, symbol);
    await checkSell(swapper, balances.emoji / 100n, symbol);
  });
});
