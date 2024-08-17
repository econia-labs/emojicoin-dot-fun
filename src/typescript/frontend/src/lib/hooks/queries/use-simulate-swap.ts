import { SimulateSwap } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { type AnyNumber, type AccountAddressString, type TypeTagInput } from "@sdk/emojicoin_dot_fun";
import { type TypeTag, type Aptos } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { withResponseError } from "./client";
import Big from "big.js";
import { useMemo } from "react";
import { toCoinTypes } from "@sdk/markets/utils";

export const simulateSwap = async (args: {
  aptos: Aptos;
  marketAddress: AccountAddressString;
  inputAmount: AnyNumber;
  isSell: boolean;
  typeTags: [TypeTagInput, TypeTagInput];
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
  const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
  const { aptos } = useAptos();
  const typeTags = [emojicoin, emojicoinLP] as [TypeTag, TypeTag];
  const { inputAmount, invalid } = useMemo(() => {
    const bigInput = Big(args.inputAmount.toString());
    const inputAmount = BigInt(bigInput.toString());
    return {
      invalid: inputAmount === 0n,
      inputAmount,
    };
  }, [args.inputAmount]);

  const { data } = useQuery({
    queryKey: [
      SimulateSwap.prototype.functionName,
      aptos.config.network,
      marketAddress,
      inputAmount.toString(),
      isSell,
      numSwaps,
      emojicoin.toString(),
      emojicoinLP.toString(),
    ],
    queryFn: () =>
      invalid
        ? {
            quote_volume: "0",
            base_volume: "0",
          }
        : simulateSwap({ aptos, ...args, inputAmount, typeTags }),
    staleTime: Infinity,
  });

  return typeof data === "undefined"
    ? data
    : isSell
      ? BigInt(data.quote_volume)
      : BigInt(data.base_volume);
};
