import { INTEGRATOR_FEE_RATE_BPS } from "lib/env";

import { POOL_FEE_RATE_BPS } from "@/sdk/index";

type FeeRateCalculationArgs = {
  inBondingCurve: boolean;
};

/**
 * To ensure the fee rate is always a static constant, use the flat fee rate from the integrator
 * fee rate when a market is in the bonding curve.
 *
 * Post-bonding curve markets incur a constant, flat 25 bps (0.25%) fee no matter what.
 *
 * To ensure fees are always the same, reduce the initial (non-pool) fee such that a market that has
 * graduated (exited the bonding curve) incurs the same fees as it did before graduating.
 *
 * @returns the base fee rate in BPs to pass to functions that take an `integrator_fee_rate_bps` arg
 *
 * NOTE: This will always return at least 0; i.e., never a negative number.
 */
export default function getDynamicBaseFeeRateBPs({ inBondingCurve }: FeeRateCalculationArgs) {
  // If the market is in the bonding curve, there's no pool fee, so just return the base fee rate.
  const bondingCurveFeeRate = INTEGRATOR_FEE_RATE_BPS;
  const res = inBondingCurve ? bondingCurveFeeRate : INTEGRATOR_FEE_RATE_BPS - POOL_FEE_RATE_BPS;
  return Math.max(res, 0);
}
