import { INTEGRATOR_FEE_RATE_BPS } from "lib/env";

import goldens from "../../../sdk/tests/unit/event-parser/goldens";
import { calculateSwapPriceFromMarketState } from "../../src/lib/utils/calculate-swap-price-from-market-state";

// 1 basis point = 1 / 10000
const BPS_CONVERSION_RATE = 10000;

describe("swap price calculation with dynamic fees", () => {
  const STATES = {
    preGraduation: goldens.BondingCurveStates.preBondingCurve[0],
    postGraduation: goldens.BondingCurveStates.postBondingCurve[0],
  };

  it("applies correct dynamic fee inside bonding curve", () => {
    const inputAmount = 1000n;
    const res = calculateSwapPriceFromMarketState({
      latestMarketState: STATES.preGraduation,
      isSell: false,
      inputAmount,
      userEmojicoinBalance: inputAmount,
    });
    expect(res.integratorFee).toEqual(
      (inputAmount * BigInt(INTEGRATOR_FEE_RATE_BPS)) / BigInt(BPS_CONVERSION_RATE)
    );
    expect(res.poolFee).toEqual(0n);
  });

  const calculatePreAndPostOutputs = ({
    inputAmount,
    isSell,
  }: {
    inputAmount: bigint;
    isSell: boolean;
  }) => {
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
    return { pre, post };
  };

  it("incurs the same total fee percentage pre and post bonding curve for a buy", () => {
    const { pre, post } = calculatePreAndPostOutputs({ inputAmount: 2000n, isSell: false });
    expect(pre.integratorFee + pre.poolFee).toEqual(post.integratorFee + post.poolFee);
  });

  it("incurs the same total fee percentage pre and post bonding curve for a sell", () => {
    const { pre, post } = calculatePreAndPostOutputs({ inputAmount: 2000n, isSell: true });
    expect(pre.integratorFee + pre.poolFee).toEqual(post.integratorFee + post.poolFee);
  });
});
