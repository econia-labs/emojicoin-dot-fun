import type { Aptos, TypeTag } from "@aptos-labs/ts-sdk";
import type { AccountInfo } from "@aptos-labs/wallet-adapter-core";
import { useQuery } from "@tanstack/react-query";
import Big from "big.js";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { useMemo } from "react";

import { tryEd25519PublicKey } from "@/components/pages/launch-emojicoin/hooks/use-register-market";
import { Swap } from "@/move-modules/emojicoin-dot-fun";
import type { AccountAddressString, AnyNumber, TypeTagInput } from "@/sdk/emojicoin_dot_fun";
import { toCoinTypes } from "@/sdk/markets/utils";

type Args = {
  aptos: Aptos;
  account: AccountInfo | null;
  swapper: AccountAddressString | undefined;
  marketAddress: AccountAddressString;
  inputAmount: AnyNumber;
  isSell: boolean;
  minOutputAmount: AnyNumber;
  typeTags: [TypeTagInput, TypeTagInput];
};

export const DEFAULT_SWAP_GAS_COST = 52500n;

const getGas = async (args: Args) => {
  if (args.account && typeof args.swapper !== "undefined") {
    const publicKey = tryEd25519PublicKey(args.account);
    if (publicKey) {
      const res = await Swap.simulate({
        aptosConfig: args.aptos.config,
        swapper: args.swapper,
        swapperPubKey: publicKey,
        marketAddress: args.marketAddress,
        inputAmount: args.inputAmount,
        isSell: args.isSell,
        integrator: INTEGRATOR_ADDRESS,
        integratorFeeRateBPs: INTEGRATOR_FEE_RATE_BPS,
        minOutputAmount: args.minOutputAmount,
        typeTags: args.typeTags,
      });
      return {
        gas_used: res.gas_used,
        gas_unit_price: res.gas_unit_price,
      };
    }
  }
  return {
    gas_used: null,
    gas_unit_price: null,
  };
};

const useGetGas = (args: Args) => {
  const { data } = useQuery({
    queryKey: ["get-gas-price", args.aptos.config.network, args.swapper ?? ""],
    queryFn: () => getGas(args),
    staleTime: 20 * 1000,
  });
  return data;
};

export const useGetGasWithDefault = (args: {
  marketAddress: AccountAddressString;
  inputAmount: bigint | number | string;
  isSell: boolean;
  numSwaps: number;
}) => {
  const { marketAddress } = args;
  const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
  const { aptos, account } = useAptos();
  const typeTags = [emojicoin, emojicoinLP] as [TypeTag, TypeTag];
  const { inputAmount, swapper, minOutputAmount } = useMemo(() => {
    const bigInput = Big(args.inputAmount.toString());
    const inputAmount = BigInt(bigInput.toString());
    return {
      invalid: inputAmount === 0n,
      inputAmount,
      minOutputAmount: 1n,
      swapper: account?.address ? (account.address as `0x${string}`) : undefined,
    };
  }, [args.inputAmount, account?.address]);

  const gas = useGetGas({
    aptos,
    account,
    ...args,
    swapper,
    inputAmount,
    minOutputAmount,
    typeTags,
  });

  // Neither of these values will ever be zero if a meaningful value is returned,
  // so we can just check if it's truthy.
  return gas && gas.gas_used && gas.gas_unit_price
    ? BigInt(gas.gas_used) * BigInt(gas.gas_unit_price)
    : DEFAULT_SWAP_GAS_COST;
};
