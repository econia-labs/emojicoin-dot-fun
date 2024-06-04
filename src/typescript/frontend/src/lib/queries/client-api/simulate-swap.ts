import { SimulateSwap } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { type AnyNumber, type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Aptos } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { withResponseError } from "./client";
import { toSwapEvent } from "@sdk/types";

export const simulateSwap = async (args: {
  aptos: Aptos;
  marketAddress: AccountAddressString;
  inputAmount: AnyNumber;
  isSell: boolean;
}) => {
  return withResponseError(
    SimulateSwap.view({
      ...args,
      swapper: "0x0",
      integrator: INTEGRATOR_ADDRESS,
      integratorFeeRateBps: INTEGRATOR_FEE_RATE_BPS,
    })
  );
};

/**
 * Simulate a swap with the view function.
 *
 * The only three params that the user can change are the marketAddress, inputAmount, and isSell.
 *
 * `args.numSwaps` are for refetching the query when the number of swaps changes.
 */
export const useSimulateSwap = (args: {
  marketAddress: AccountAddressString;
  inputAmount: bigint;
  isSell: boolean;
  numSwaps: number;
}) => {
  const { marketAddress, inputAmount, isSell, numSwaps } = args;
  const { aptos } = useAptos();

  const { data } = useQuery({
    queryKey: [
      SimulateSwap.prototype.functionName,
      aptos.config.network,
      marketAddress,
      inputAmount.toString(),
      isSell,
      numSwaps,
    ],
    queryFn: () => simulateSwap({ aptos, ...args }),
    staleTime: Infinity,
  });

  const simulatedSwap = data ? toSwapEvent(data) : undefined;
  if (!simulatedSwap) {
    return {
      emojiAmount: undefined,
      aptAmount: undefined,
      simulatedSwap: undefined,
    };
  }

  // If it's a buy, the inputAmount is the amount of APT.
  // If it's a sell, the inputAmount is the amount of emoji.
  // In both cases, the baseVolume is the amount of emoji, and the quoteVolume is the amount of APT.
  // To make it more intuitive, we always show the exact input amounts, but for the amount the user
  // receives, we show the amount after fees, which is the corresponding volume.
  return {
    emojiAmount: isSell ? inputAmount : simulatedSwap.baseVolume,
    aptAmount: isSell ? simulatedSwap.quoteVolume : inputAmount,
    simulatedSwap,
  };
};
