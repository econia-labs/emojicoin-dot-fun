import Big, { roundDown } from "big.js";

import {
  BASE_VIRTUAL_FLOOR,
  BASIS_POINTS_PER_UNIT,
  EMOJICOIN_REMAINDER,
  POOL_FEE_RATE_BPS,
  QUOTE_REAL_CEILING,
  QUOTE_VIRTUAL_CEILING,
} from "../const";
import type { AnyNumberString, Types } from "../types";

export class CustomCalculatedSwapError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class SwapNotEnoughBaseError extends CustomCalculatedSwapError {
  constructor() {
    super("Not enough base to swap.");
  }
}

export class DivideByZeroError extends CustomCalculatedSwapError {
  constructor() {
    super("Can't divide by zero.");
  }
}

export type SwapNetProceedsArgs = {
  clammVirtualReserves: Types["Reserves"];
  cpammRealReserves: Types["Reserves"];
  startsInBondingCurve: boolean;
  isSell: boolean;
  inputAmount: AnyNumberString;
  userEmojicoinBalance: AnyNumberString;
  feeRateBPs: number;
};

export const getBPsFee = (principal: Big, feeRateBPs: AnyNumberString) =>
  principal
    .mul(feeRateBPs.toString())
    .div(BASIS_POINTS_PER_UNIT.toString())
    .round(0, Big.roundDown);

const cpammSimpleSwapOutputAmount = ({
  inputAmount,
  isSell,
  reserves,
}: {
  inputAmount: Big;
  isSell: boolean;
  reserves: Types["Reserves"];
}) => {
  const [numeratorCoefficient, denominatorAddend] = isSell
    ? [reserves.quote, reserves.base]
    : [reserves.base, reserves.quote];
  const numerator = inputAmount.mul(numeratorCoefficient.toString());
  const denominator = inputAmount.plus(denominatorAddend.toString());
  if (!denominator.gt(0)) {
    throw new DivideByZeroError();
  }
  return numerator.div(denominator);
};

/**
 * @throws @see {@link SwapNotEnoughBaseError} if the user does not have enough base
 * @throws @see {@link DivideByZeroError} if the cpamm output calculation results in a divide by zero
 * @see {@link https://github.com/econia-labs/emojicoin-dot-fun/blob/295cf611950f66651452baa3e6ad6d6aef583f9b/src/move/emojicoin_dot_fun/sources/emojicoin_dot_fun.move#L1691}
 */
const calculateExactSwapNetProceeds = (args: SwapNetProceedsArgs) => {
  const {
    clammVirtualReserves,
    cpammRealReserves,
    startsInBondingCurve,
    userEmojicoinBalance,
    isSell,
    feeRateBPs,
  } = args;
  const inputAmount = Big(BigInt(args.inputAmount).toString());
  const balanceBefore = Big(BigInt(userEmojicoinBalance).toString());

  let poolFee: Big = Big(0);
  let baseVolume: Big;
  let quoteVolume: Big;
  let integratorFee: Big;
  let resultsInStateTransition = false;

  // -------------------------- Selling --------------------------
  if (isSell) {
    let ammQuoteOutput: Big;
    if (startsInBondingCurve) {
      ammQuoteOutput = cpammSimpleSwapOutputAmount({
        inputAmount,
        isSell,
        reserves: clammVirtualReserves,
      });
    } else {
      ammQuoteOutput = cpammSimpleSwapOutputAmount({
        inputAmount,
        isSell,
        reserves: cpammRealReserves,
      });
      poolFee = getBPsFee(ammQuoteOutput, POOL_FEE_RATE_BPS);
    }
    integratorFee = getBPsFee(ammQuoteOutput, feeRateBPs);
    baseVolume = inputAmount; /* eslint-disable-line */
    quoteVolume = ammQuoteOutput.minus(poolFee).minus(integratorFee);
    const netProceeds = quoteVolume;
    if (!inputAmount.lte(balanceBefore)) {
      throw new SwapNotEnoughBaseError();
    }
    // Unused, but kept here to preserve the Move code flow.
    const _balanceAfter = balanceBefore.minus(inputAmount);
    return { netProceeds, integratorFee, poolFee, baseVolume, quoteVolume };
  } else {
    // -------------------------- Buying --------------------------
    integratorFee = getBPsFee(inputAmount, feeRateBPs);
    quoteVolume = inputAmount.minus(integratorFee);
    if (startsInBondingCurve) {
      const maxQuoteVolumeInClamm = Big(
        BigInt(QUOTE_VIRTUAL_CEILING - clammVirtualReserves.quote).toString()
      );
      if (quoteVolume.lt(maxQuoteVolumeInClamm)) {
        baseVolume = cpammSimpleSwapOutputAmount({
          inputAmount: quoteVolume,
          isSell,
          reserves: clammVirtualReserves,
        });
      } else {
        // Max quote has been deposited to bonding curve.
        resultsInStateTransition = true;
        const _ = resultsInStateTransition;
        // Clear out remaining base.
        baseVolume = Big((clammVirtualReserves.base - BASE_VIRTUAL_FLOOR).toString());
        const remainingQuoteVolume = quoteVolume.minus(maxQuoteVolumeInClamm);
        // Keep buying against CPAMM.
        if (remainingQuoteVolume.gt(0)) {
          // Evaluate swap against CPAMM with newly locked liquidity.
          const cpammBaseOutput = cpammSimpleSwapOutputAmount({
            inputAmount: remainingQuoteVolume,
            isSell,
            reserves: {
              base: EMOJICOIN_REMAINDER,
              quote: QUOTE_REAL_CEILING,
            },
          });
          poolFee = getBPsFee(cpammBaseOutput, POOL_FEE_RATE_BPS);
          baseVolume = baseVolume.plus(cpammBaseOutput).minus(poolFee);
        }
      }
    } else {
      // Buying from CPAMM only.
      const cpammBaseOutput = cpammSimpleSwapOutputAmount({
        inputAmount: quoteVolume,
        isSell,
        reserves: cpammRealReserves,
      });
      const poolFee = getBPsFee(cpammBaseOutput, POOL_FEE_RATE_BPS);
      baseVolume = cpammBaseOutput.minus(poolFee);
    }
    const netProceeds = baseVolume;
    // Unused, but kept here to preserve the Move code flow.
    const _balanceAfter = balanceBefore.plus(netProceeds);
    return { netProceeds, integratorFee, poolFee, baseVolume, quoteVolume };
  }
};

type NetProceedsReturnTypes =
  | {
      netProceeds: bigint;
      integratorFee: bigint;
      poolFee: bigint;
      baseVolume: bigint;
      quoteVolume: bigint;
      error: null;
    }
  | {
      netProceeds: 0n;
      integratorFee: 0n;
      poolFee: 0n;
      baseVolume: 0n;
      quoteVolume: 0n;
      error: CustomCalculatedSwapError;
    };

/**
 * Round a decimalized number down to zero decimal places like an unsigned integer will in Move.
 * @param b the Big input
 * @returns a bigint
 */
function roundDownToBigInt(b: Big): bigint {
  return BigInt(b.round(0, Big.roundDown).toString());
}

/**
 * The wrapper function for calculating the swap proceeds. This function rounds
 * the returned value down like the Move module does, since technically
 * this code is more precise than the Move code with truncated uint values.
 *
 * @returns the total net proceeds- denominated in quote or volume based on `isSell`.
 * @returns 0 if the calculation results in an error.
 */
export const calculateSwapNetProceeds = (args: SwapNetProceedsArgs): NetProceedsReturnTypes => {
  try {
    const res = calculateExactSwapNetProceeds(args);
    return {
      netProceeds: roundDownToBigInt(res.netProceeds),
      integratorFee: roundDownToBigInt(res.integratorFee),
      poolFee: roundDownToBigInt(res.poolFee),
      baseVolume: roundDownToBigInt(res.baseVolume),
      quoteVolume: roundDownToBigInt(res.quoteVolume),
      error: null,
    };
  } catch (e) {
    const DEFAULTS = {
      netProceeds: 0n,
      integratorFee: 0n,
      poolFee: 0n,
      baseVolume: 0n,
      quoteVolume: 0n,
    } as const;
    if (e instanceof CustomCalculatedSwapError) {
      return {
        ...DEFAULTS,
        error: e,
      };
    }
    console.warn(`Unexpected error when calculating swap ${e}`);
    return {
      ...DEFAULTS,
      error: null,
    };
  }
};
