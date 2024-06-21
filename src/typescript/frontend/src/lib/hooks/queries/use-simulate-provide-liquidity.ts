import { type AnyNumber, type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Aptos } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { withResponseError } from "lib/hooks/queries/client";
import { SimulateProvideLiquidity } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";

export const simulateProvideLiquidity = async (args: {
  aptos: Aptos;
  marketAddress: AccountAddressString;
  quoteAmount: AnyNumber;
}) => {
  return withResponseError(
    SimulateProvideLiquidity.view({
      ...args,
      provider: "0x0",
    })
  );
};

/**
 * Simulate a liquidity provision with the view function.
 * The only two params that the user can change are the marketAddress, and quoteAmount
 */
export const useSimulateProvideLiquidity = (args: {
  marketAddress: AccountAddressString | undefined;
  quoteAmount: bigint | number | string;
}) => {
  const { marketAddress } = args;
  const { aptos } = useAptos();
  const quoteAmount = BigInt(args.quoteAmount);
  const invalid = quoteAmount === 0n || isNaN(Number(quoteAmount)) || marketAddress === undefined;

  const { data } = useQuery({
    queryKey: [
      SimulateProvideLiquidity.prototype.functionName,
      aptos.config.network,
      marketAddress,
      quoteAmount.toString(),
    ],
    queryFn: () =>
      invalid
        ? {
            base_amount: "0",
          }
        : simulateProvideLiquidity({ aptos, ...args, marketAddress, quoteAmount }),
    staleTime: Infinity,
  });

  return typeof data === "undefined" ? data : BigInt(data.base_amount);
};
