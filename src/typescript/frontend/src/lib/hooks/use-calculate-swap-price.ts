import { INITIAL_REAL_RESERVES, INITIAL_VIRTUAL_RESERVES } from "@sdk/const";
import {
  calculateSwapNetProceeds,
  SwapNetProceedsArgs,
  SwapNotEnoughBaseError,
} from "@sdk/emojicoin_dot_fun/calculate-swap-price";
import { DatabaseModels } from "@sdk/indexer-v2/types";
import { AnyNumberString, Types } from "@sdk/types/types";

/**
 * This hook calls the client-side calculation of the swap net proceeds amount.
 * If the Move contract logic would result in an error being thrown, it's captured
 * in the `error` field returned by the calculation function called in this hook.
 *
 * In order to not disrupt the execution flow and see the resulting output swap price
 * regardless of the input user balance, we re-run the client-side simulation if the input
 * is invalid due to insufficient balance, but if the simulation results in a divide by
 * zero error, we don't return, since that is due to invalid input amount.
 */
export const useCalculateSwapPrice = ({
  lastSwapEvent,
  isSell,
  inputAmount,
  userEmojicoinBalance,
}: {
  lastSwapEvent?: DatabaseModels["swap_events"];
  isSell: boolean;
  inputAmount: AnyNumberString;
  userEmojicoinBalance: AnyNumberString;
}) => {
  const args: SwapNetProceedsArgs = {
    ...getReservesAndBondingCurveStateWithDefault(lastSwapEvent),
    isSell,
    inputAmount,
    userEmojicoinBalance,
  };
  const res = calculateSwapNetProceeds(args);
  // If the error is due to an insufficient user balance,
  // simulate the calculation again, ensuring that the
  // user emojicoin balance is sufficient.
  if (res.error instanceof SwapNotEnoughBaseError) {
    const { netProceeds: recalculatedNetProceeds } = calculateSwapNetProceeds({
      ...args,
      userEmojicoinBalance: BigInt(args.inputAmount) + 1n,
    });
    // Force the return type to show that the error was an insufficient balance.
    return {
      netProceeds: recalculatedNetProceeds,
      error: res.error,
    };
  }
  // Otherwise, just return the result.
  // Note that this \may return a divide by zero error still.
  return res;
};

const getReservesAndBondingCurveStateWithDefault = (
  lastSwapEvent?: DatabaseModels["swap_events"]
) => {
  if (lastSwapEvent) {
    return {
      clammVirtualReserves: lastSwapEvent.state.clammVirtualReserves,
      cpammRealReserves: lastSwapEvent.state.cpammRealReserves,
      startsInBondingCurve: lastSwapEvent.swap.startsInBondingCurve,
    };
  }
  return {
    clammVirtualReserves: INITIAL_VIRTUAL_RESERVES,
    cpammRealReserves: INITIAL_REAL_RESERVES,
    startsInBondingCurve: false,
  };
};
