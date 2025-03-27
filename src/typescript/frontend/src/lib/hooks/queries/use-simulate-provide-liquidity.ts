import type { AnyNumber, AccountAddressString, TypeTagInput } from "@sdk/emojicoin_dot_fun";
import  {SimulateProvideLiquidity_v2 ,SimulateRemoveLiquidity_v2} from "@/contract-apis/emojicoin-dot-fun_v2";
import {type Aptos, type AptosConfig} from "@aptos-labs/ts-sdk";
import { useQuery } from "@tanstack/react-query";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { withResponseError } from "lib/hooks/queries/client";
import {
  SimulateProvideLiquidity,
  SimulateRemoveLiquidity,
} from "@/contract-apis/emojicoin-dot-fun";

export const simulateProvideLiquidity = async (args: {
  aptos: Aptos | AptosConfig;
  marketAddress: AccountAddressString;
  quoteAmount: AnyNumber;
}) => {
  return withResponseError(
      SimulateProvideLiquidity.view({
        aptos:args.aptos ,
        provider: "0x0",
          marketAddress:args.marketAddress,
          quoteAmount:args.quoteAmount
      }).catch(() =>
          SimulateProvideLiquidity_v2.view({
              aptos:args.aptos  ,
              provider: "0x0",
              marketAddress:args.marketAddress,
              quoteAmount:args.quoteAmount
          })
      )
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
    queryFn: async () =>{
        if (invalid) {
            // 如果输入无效，返回默认值
            return {
                base_amount: "0",
                lp_coin_amount: "0",
            };
        }
        try {
            // 第一次尝试使用第一代合约
            return await SimulateProvideLiquidity.view({
                aptos,
                provider: "0x0",
                marketAddress: marketAddress,
                quoteAmount,
            });
        } catch (error) {
            // 如果第一代合约调用失败，则尝试使用第二代合约
            return await SimulateProvideLiquidity_v2.view({
                aptos,
                provider: "0x0",
                marketAddress: marketAddress,
                quoteAmount,
            });
        }
         },
      staleTime: Infinity,
  });

  return data;
};

export const simulateRemoveLiquidity = async (args: {
  aptos: Aptos;
  marketAddress: AccountAddressString;
  lpCoinAmount: AnyNumber;
  typeTags: [TypeTagInput];
}) => {
  return withResponseError(
    SimulateRemoveLiquidity.view({
      ...args,
      provider: "0x0",
    }).catch(()=> SimulateRemoveLiquidity_v2.view({
        ...args,
        provider: "0x0",
    }))
  );
};

/**
 * Simulate a liquidity provision with the view function.
 * The only two params that the user can change are the marketAddress, and quoteAmount
 */
export const useSimulateRemoveLiquidity = (args: {
  marketAddress: AccountAddressString | undefined;
  lpCoinAmount: bigint | number | string;
  typeTags: [TypeTagInput];
}) => {
  const { marketAddress } = args;
  const { aptos } = useAptos();
  const lpCoinAmount = BigInt(args.lpCoinAmount);
  const invalid = lpCoinAmount === 0n || isNaN(Number(lpCoinAmount)) || marketAddress === undefined;

  const { data } = useQuery({
    queryKey: [
      SimulateRemoveLiquidity.prototype.functionName,
      aptos.config.network,
      marketAddress,
      lpCoinAmount.toString(),
    ],
    queryFn: () =>
      invalid
        ? {
            base_amount: "0",
            quote_amount: "0",
          }
        : simulateRemoveLiquidity({ aptos, ...args, marketAddress, lpCoinAmount }),
    staleTime: Infinity,
  });

  return data;
};
