import {
  BASE_VIRTUAL_FLOOR,
  BASIS_POINTS_PER_UNIT,
  EMOJICOIN_REMAINDER,
  INTEGRATOR_FEE_RATE_BPS,
  POOL_FEE_RATE_BPS,
  QUOTE_REAL_CEILING,
  QUOTE_VIRTUAL_CEILING,
} from "../const";
import { type AnyNumberString, type Types } from "../types";
import Big from "big.js";

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
};

const getBPsFee = (principal: Big, feeRateBPs: AnyNumberString) =>
  principal.mul(feeRateBPs.toString()).div(BASIS_POINTS_PER_UNIT.toString());

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
 * @throws {@link SwapNotEnoughBaseError} if the user does not have enough base
 * @throws {@link DivideByZeroError} if the cpamm output calculation results in a divide by zero
 */
const calculateExactSwapNetProceeds = (args: SwapNetProceedsArgs) => {
  const {
    clammVirtualReserves,
    cpammRealReserves,
    startsInBondingCurve,
    userEmojicoinBalance,
    isSell,
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
    integratorFee = getBPsFee(ammQuoteOutput, INTEGRATOR_FEE_RATE_BPS);
    baseVolume = inputAmount; /* eslint-disable-line */
    quoteVolume = ammQuoteOutput.minus(poolFee).minus(integratorFee);
    const netProceeds = quoteVolume;
    if (!inputAmount.lte(balanceBefore)) {
      throw new SwapNotEnoughBaseError();
    }
    // Unused, but kept here to preserve the Move code flow.
    const _balanceAfter = balanceBefore.minus(inputAmount);
    return netProceeds;
  } else {
    // -------------------------- Buying --------------------------
    integratorFee = getBPsFee(inputAmount, INTEGRATOR_FEE_RATE_BPS);
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
    return netProceeds;
  }
};

type NetProceedsReturnTypes =
  | {
      netProceeds: bigint;
      error: null;
    }
  | {
      netProceeds: 0n;
      error: CustomCalculatedSwapError;
    };

/**
 * The wrapper function for calculating the swap proceeds. This function rounds
 * the returned value down like the Move contract does, since technically
 * this code is more precise than the Move code with truncated uint values.
 *
 * @returns the total net proceeds- denominated in quote or volume based on `isSell`.
 * @returns 0 if the calculation results in an error.
 */
export const calculateSwapNetProceeds = (args: {
  clammVirtualReserves: Types["Reserves"];
  cpammRealReserves: Types["Reserves"];
  startsInBondingCurve: boolean;
  isSell: boolean;
  inputAmount: AnyNumberString;
  userEmojicoinBalance: AnyNumberString;
}): NetProceedsReturnTypes => {
  try {
    const res = calculateExactSwapNetProceeds(args);
    // Round down to zero decimal places like an unsigned integer will in Move.
    const netProceeds = BigInt(res.round(0, Big.roundDown).toString());
    return {
      netProceeds,
      error: null,
    };
  } catch (e) {
    if (e instanceof CustomCalculatedSwapError) {
      return {
        netProceeds: 0n,
        error: e,
      };
    }
    console.warn(`Unexpected error when calculating swap ${e}`);
    return {
      netProceeds: 0n,
      error: null,
    };
  }
};
