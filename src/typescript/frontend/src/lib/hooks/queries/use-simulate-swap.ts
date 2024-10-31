import { SimulateSwap, Swap } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import {
  type AnyNumber,
  type AccountAddressString,
  type TypeTagInput,
} from "@sdk/emojicoin_dot_fun";
import { type TypeTag, type Aptos } from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { withResponseError } from "./client";
import Big from "big.js";
import { useMemo } from "react";
import { toCoinTypes } from "@sdk/markets/utils";
import { type AccountInfo } from "@aptos-labs/wallet-adapter-core";
import { tryEd25519PublicKey } from "components/pages/launch-emojicoin/hooks/use-register-market";
import { EMOJICOIN_DOT_FUN_MODULE_NAME, MODULE_ADDRESS } from "@sdk/const";

export const simulateSwap = async (args: {
  aptos: Aptos;
  account: AccountInfo | null;
  swapper: AccountAddressString;
  marketAddress: AccountAddressString;
  inputAmount: AnyNumber;
  isSell: boolean;
  minOutputAmount: AnyNumber;
  typeTags: [TypeTagInput, TypeTagInput];
}) => {
  if (args.account) {
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
      const swapName = `${MODULE_ADDRESS}::${EMOJICOIN_DOT_FUN_MODULE_NAME}::Swap`;
      const swapEvent = res.events.find((e) => e.type === swapName)!;
      return {
        base_volume: swapEvent.data.base_volume,
        quote_volume: swapEvent.data.quote_volume,
        gas_used: res.gas_used,
        gas_unit_price: res.gas_unit_price,
      };
    }
  }
  const res = await withResponseError(
    SimulateSwap.view({
      ...args,
      integrator: INTEGRATOR_ADDRESS,
      integratorFeeRateBPs: INTEGRATOR_FEE_RATE_BPS,
    })
  );
  return {
    base_volume: res.base_volume,
    quote_volume: res.quote_volume,
    gas_used: null,
    gas_unit_price: null,
  };
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
  const { aptos, account } = useAptos();
  const typeTags = [emojicoin, emojicoinLP] as [TypeTag, TypeTag];
  const { inputAmount, invalid, swapper, minOutputAmount } = useMemo(() => {
    const bigInput = Big(args.inputAmount.toString());
    const inputAmount = BigInt(bigInput.toString());
    return {
      invalid: inputAmount === 0n,
      inputAmount,
      minOutputAmount: 1n,
      swapper: account?.address ? (account.address as `0x${string}`) : undefined,
    };
  }, [args.inputAmount, account?.address]);

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
      swapper ?? "",
      minOutputAmount.toString(),
    ],
    queryFn: () =>
      invalid || typeof swapper === "undefined"
        ? {
            quote_volume: "0",
            base_volume: "0",
            gas_used: null,
            gas_unit_price: null,
          }
        : simulateSwap({
            aptos,
            account,
            ...args,
            swapper,
            inputAmount,
            minOutputAmount,
            typeTags,
          }),
    staleTime: Infinity,
  });

  return typeof data === "undefined"
    ? data
    : {
        gasCost:
          typeof data.gas_used === "string" && typeof data.gas_unit_price === "string"
            ? BigInt(data.gas_used) * BigInt(data.gas_unit_price)
            : null,
        swapResult: isSell ? BigInt(data.quote_volume) : BigInt(data.base_volume),
      };
};
