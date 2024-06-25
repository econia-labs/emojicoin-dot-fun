import { SimulateSwap } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { type AnyNumber, type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Aptos } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { withResponseError } from "./client";

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
 * The only three params that the user can change are the marketAddress, inputAmount, and isSell.
 * `numSwaps` is for invalidating the cache and refetching the query when the # of swaps changes.
 */
export const useSimulateSwap = (args: {
  marketAddress: AccountAddressString;
  inputAmount: bigint | number | string;
  isSell: boolean;
  numSwaps: number;
}) => {
  const { marketAddress, isSell, numSwaps } = args;
  const { aptos } = useAptos();
  const inputAmount = BigInt(args.inputAmount);
  const invalid = inputAmount === 0n || isNaN(Number(inputAmount));

  const { data } = useQuery({
    queryKey: [
      SimulateSwap.prototype.functionName,
      aptos.config.network,
      marketAddress,
      inputAmount.toString(),
      isSell,
      numSwaps,
    ],
    queryFn: () =>
      invalid
        ? {
            quote_volume: "0",
            base_volume: "0",
          }
        : simulateSwap({ aptos, ...args, inputAmount }),
    staleTime: Infinity,
  });

  return typeof data === "undefined"
    ? data
    : isSell
      ? BigInt(data.quote_volume)
      : BigInt(data.base_volume);
};
