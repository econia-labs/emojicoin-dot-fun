import {
  // BASE_VIRTUAL_CEILING,
  BASE_VIRTUAL_FLOOR,
  BASIS_POINTS_PER_UNIT,
  EMOJICOIN_REMAINDER,
  // EMOJICOIN_SUPPLY,
  POOL_FEE_RATE_BPS,
  QUOTE_REAL_CEILING,
  QUOTE_VIRTUAL_CEILING,
} from "@sdk/const";
import { type AnyNumberString, type Types } from "@sdk/types/types";
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

/**
 * NOTE: This function throws an error just like the move code.
 * Use a try/catch around it to catch invalid inputs/invalid on-chain state.
 *
 */
export const calculatedSwap = ({
  marketData,
  inputAmountMaybeString,
  userEmojicoinBalance,
}: {
  marketData: {
    clammVirtualReserves: Types["Reserves"];
    cpammRealReserves: Types["Reserves"];
    // inBondingCurve: boolean;
    isSell: boolean;
    startsInBondingCurve: boolean;
  };
  inputAmountMaybeString: AnyNumberString;
  userEmojicoinBalance: AnyNumberString;
}) => {
  const inputAmount = Big(BigInt(inputAmountMaybeString).toString());
  const balanceBefore = Big(BigInt(userEmojicoinBalance).toString());
  const { clammVirtualReserves, cpammRealReserves, isSell, startsInBondingCurve } = marketData;

  let poolFee: Big = Big(0);
  let baseVolume: Big;
  let quoteVolume: Big;
  let integratorFee: Big;
  let resultsInStateTransition = false;

  // SELLING.
  if (isSell) {
    const ammQuoteOutput = startsInBondingCurve
      ? cpammSimpleSwapOutputAmount({
          inputAmount,
          isSell,
          reserves: clammVirtualReserves,
        })
      : cpammSimpleSwapOutputAmount({
          inputAmount,
          isSell,
          reserves: cpammRealReserves,
        });
    if (startsInBondingCurve) {
      poolFee = getBPsFee(ammQuoteOutput);
    }
    integratorFee = getBPsFee(ammQuoteOutput);
    baseVolume = inputAmount; /* eslint-disable-line */
    quoteVolume = ammQuoteOutput.minus(poolFee).minus(integratorFee);
    const netProceeds = quoteVolume;
    if (!inputAmount.lte(balanceBefore)) {
      throw new SwapNotEnoughBaseError();
    }
    // const balanceAfter = balanceBefore.minus(inputAmount);
    return netProceeds;
  } else {
    // BUYING.
    integratorFee = getBPsFee(inputAmount);
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
          poolFee = getBPsFee(cpammBaseOutput);
          baseVolume = baseVolume.plus(cpammBaseOutput).minus(poolFee);
          //   baseVolume = cpammBaseOutput.minus(poolFee);
        }
      }
    } else {
      // Buying from CPAMM only.
      const cpammBaseOutput = cpammSimpleSwapOutputAmount({
        inputAmount: quoteVolume,
        isSell,
        reserves: cpammRealReserves,
      });
      const poolFee = getBPsFee(cpammBaseOutput);
      baseVolume = cpammBaseOutput.minus(poolFee);
    }
    const netProceeds = baseVolume;
    const _balanceAfter = balanceBefore.plus(netProceeds);
    return netProceeds;
  }
};

const getBPsFee = (principal: Big) =>
  principal.mul(POOL_FEE_RATE_BPS).div(BASIS_POINTS_PER_UNIT.toString());

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

// const assignSupplyMinuendAndReserves = ({
//   clammVirtualReserves,
//   cpammRealReserves,
//   inBondingCurve,
// }: {
//   clammVirtualReserves: Types["Reserves"];
//   cpammRealReserves: Types["Reserves"];
//   inBondingCurve: boolean;
// }): {
//   supplyMinuend: bigint;
//   reserves: Types["Reserves"];
// } => {
//   return inBondingCurve
//     ? {
//         supplyMinuend: BASE_VIRTUAL_CEILING,
//         reserves: clammVirtualReserves,
//       }
//     : {
//         supplyMinuend: EMOJICOIN_SUPPLY,
//         reserves: cpammRealReserves,
//       };
// };
