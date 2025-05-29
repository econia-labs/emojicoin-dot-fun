import Big from "big.js";
import { INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import getDynamicBaseFeeRateBPs from "lib/utils/get-dynamic-base-fee-rate";

import { BASIS_POINTS_PER_UNIT, calculateCurvePrice, POOL_FEE_RATE_BPS } from "@/sdk/index";

import goldens from "../../../sdk/tests/unit/event-parser/goldens";
import { calculateSwapPriceFromMarketState } from "../../src/lib/utils/calculate-swap-price-from-market-state";

describe("swap price calculation with dynamic fees", () => {
  const STATES = {
    preGraduation: goldens.BondingCurveStates.preBondingCurve[0],
    postGraduation: goldens.BondingCurveStates.postBondingCurve[0],
  };

  it("sets the fee rates to the same total fee amount for markets pre/post bonding curve", () => {
    const preRate = getDynamicBaseFeeRateBPs({ inBondingCurve: true });
    const postRate = getDynamicBaseFeeRateBPs({ inBondingCurve: false });
    // There is no pool fee in the bonding curve, so there's no pool fee rate incurred there.
    expect(preRate).toEqual(postRate + POOL_FEE_RATE_BPS);
  });

  it("applies correct dynamic fee inside bonding curve", () => {
    const inputAmount = 1000n;
    const res = calculateSwapPriceFromMarketState({
      latestMarketState: STATES.preGraduation,
      isSell: false,
      inputAmount,
      userEmojicoinBalance: inputAmount,
    });
    expect(res.integratorFee).toEqual(
      (inputAmount * BigInt(INTEGRATOR_FEE_RATE_BPS)) / BigInt(BASIS_POINTS_PER_UNIT)
    );
    expect(res.poolFee).toEqual(0n);
  });

  // Helper function to convert some quote amount to the equivalent base amount given the current
  // state of a market.
  // This is just a rough estimate to get a meaningful size for the base input amount, so the pre
  // graduation state is used here.
  function getEquivalentBaseAmount(quoteAmount: bigint): bigint {
    const price = calculateCurvePrice(STATES.preGraduation.state);
    const equivalentAmount = Big(quoteAmount.toString()).div(price);
    const rounded = equivalentAmount.round(0, Big.roundDown);
    return BigInt(rounded.toString());
  }

  const QUOTE_SIZES = [100_000n, 100_000_000n];

  // Convert to base for these, since it's selling with emojicoin (aka base).
  QUOTE_SIZES.map(getEquivalentBaseAmount).forEach((inputAmount) =>
    test(`should incur the same total fee percentage pre/post bonding curve for a sell of size ${inputAmount}`, () => {
      expect(inputAmount).toBeGreaterThanOrEqual(1n);
      checkOutputs({ inputAmount, isSell: true });
    })
  );

  // Use these as quote amounts directly, since it's buying with APT (aka quote).
  QUOTE_SIZES.forEach((inputAmount) =>
    test(`should incur the same total fee percentage pre/post bonding curve for a buy of size ${inputAmount}`, () => {
      expect(inputAmount).toBeGreaterThanOrEqual(1n);
      checkOutputs({ inputAmount, isSell: false });
    })
  );

  /**
   * This is the main function that checks the validity of the outputs as a percentage of the
   * volume resulting from a swap buy/sell. The comments in the code should thoroughly explain
   * the reasoning and how to follow again.
   *
   * See {@link calculateSwapPriceFromMarketState} and its inner logic/function calls to understand
   * more thoroughly. Ultimately, it is emulating the Move code logic.
   */
  function checkOutputs({ inputAmount, isSell }: { inputAmount: bigint; isSell: boolean }) {
    const otherArgs = {
      isSell,
      inputAmount,
      userEmojicoinBalance: inputAmount,
    };
    const pre = calculateSwapPriceFromMarketState({
      latestMarketState: STATES.preGraduation,
      ...otherArgs,
    });
    const post = calculateSwapPriceFromMarketState({
      latestMarketState: STATES.postGraduation,
      ...otherArgs,
    });

    // Pre pool fee is always 0.
    expect(pre.poolFee).toEqual(0n);

    // Get fee as percentage of net proceeds. A numeric percentage; i.e., 0 - 100.
    const percentageOfNetProceeds = (flatFee: bigint, quoteVolume: bigint) => {
      if (quoteVolume === 0n) {
        expect(flatFee).toEqual(0n);
        return 0;
      }
      return Big(flatFee.toString()).div(quoteVolume.toString()).toNumber() * 100;
    };
    const preIntegratorFeePercentage = percentageOfNetProceeds(pre.integratorFee, pre.quoteVolume);
    const prePoolFeePercentage = percentageOfNetProceeds(pre.poolFee, pre.quoteVolume);
    const postIntegratorFeePercentage = percentageOfNetProceeds(
      post.integratorFee,
      post.quoteVolume
    );
    // Pool fees are deducted differently depending on the type of swap it is.
    //   - If it's a sell, the pool fee is deducted from the quote volume.
    //   - If it's a buy, the pool fee is deducted from the base volume.
    const postPoolFeePercentage = percentageOfNetProceeds(
      post.poolFee,
      isSell ? post.quoteVolume : post.baseVolume
    );

    expect(POOL_FEE_RATE_BPS).not.toEqual(0);
    expect(prePoolFeePercentage).toEqual(0);

    // This assumption is made in the dynamic fee calculation function and is called there as well,
    // including at build time.
    expect(INTEGRATOR_FEE_RATE_BPS).toBeGreaterThanOrEqual(POOL_FEE_RATE_BPS);

    // The pre/post integrator fee percentages should not be the same, since the pool fee should
    // not be zero.

    expect(preIntegratorFeePercentage).not.toEqual(postIntegratorFeePercentage);

    // The pre integrator fee percentage should be very close to the post fee percentages of both
    // of the fee types.
    expect(preIntegratorFeePercentage).toBeCloseTo(
      postIntegratorFeePercentage + postPoolFeePercentage
    );
  }
});
