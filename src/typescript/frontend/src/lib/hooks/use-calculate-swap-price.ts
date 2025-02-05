import { INITIAL_REAL_RESERVES, INITIAL_VIRTUAL_RESERVES } from "@sdk/const";
import {
  calculateSwapNetProceeds,
  type SwapNetProceedsArgs,
  SwapNotEnoughBaseError,
} from "@sdk/emojicoin_dot_fun/calculate-swap-price";
import { type DatabaseModels } from "@sdk/indexer-v2/types";
import { type AnyNumberString } from "@sdk/types/types";

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
  latestMarketState,
  isSell,
  inputAmount,
  userEmojicoinBalance,
}: {
  latestMarketState?: DatabaseModels["market_latest_state_event"];
  isSell: boolean;
  inputAmount: AnyNumberString;
  userEmojicoinBalance: AnyNumberString;
}) => {
  const args: SwapNetProceedsArgs = {
    ...getReservesAndBondingCurveStateWithDefault(latestMarketState),
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
  latestMarketState?: DatabaseModels["market_latest_state_event"]
) => {
  if (latestMarketState) {
    return {
      clammVirtualReserves: latestMarketState.state.clammVirtualReserves,
      cpammRealReserves: latestMarketState.state.cpammRealReserves,
      startsInBondingCurve: latestMarketState.inBondingCurve,
    };
  }
  return {
    clammVirtualReserves: INITIAL_VIRTUAL_RESERVES,
    cpammRealReserves: INITIAL_REAL_RESERVES,
    startsInBondingCurve: true,
  };
};
