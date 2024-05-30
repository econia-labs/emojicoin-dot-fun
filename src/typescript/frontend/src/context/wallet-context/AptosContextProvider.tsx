import { AptosApiError, type Aptos, type PendingTransactionResponse } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { toast } from "react-toastify";

import { APTOS_NETWORK } from "lib/env";
import {
  type EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
} from "@sdk/emojicoin_dot_fun/payload-builders";
import { getAptos } from "lib/utils/aptos-client";
import { checkNetworkAndToast, parseAPIErrorAndToast } from "./toasts";

type WalletContextState = ReturnType<typeof useWallet>;

export type BuilderFunction = () => Promise<
  EntryFunctionPayloadBuilder | EntryFunctionTransactionBuilder
>;

export type AptosContextState = {
  client: Aptos;
  helper: (
    builderFn: BuilderFunction
  ) => ReturnType<WalletContextState["signAndSubmitTransaction"]>;
  signAndSubmitTransaction: WalletContextState["signAndSubmitTransaction"];
  account: WalletContextState["account"];
};

export const AptosContext = createContext<AptosContextState | undefined>(undefined);

export function AptosContextProvider({ children }: PropsWithChildren) {
  const { signAndSubmitTransaction: adapterSignAndSubmitTxn, account, network } = useWallet();

  const client = useMemo(() => {
    if (checkNetworkAndToast(network)) {
      return getAptos(network.name);
    }
    return getAptos(APTOS_NETWORK);
  }, [network]);

  const helper = useCallback(
    async (builderFn: BuilderFunction) => {
      if (!checkNetworkAndToast(network, true)) {
        return
      }
      try {
        const builder = await builderFn();
        const input =
          builder instanceof EntryFunctionTransactionBuilder
            ? builder.payloadBuilder.toInputPayload()
            : builder.toInputPayload();
        const res: PendingTransactionResponse = await adapterSignAndSubmitTxn(input);
        try {
          await client.waitForTransaction({
            transactionHash: res.hash,
          });
          toast.success("Transaction confirmed");
          return true;
        } catch (error) {
          toast.error("Transaction failed");
          console.error(error);
          return false;
        }
      } catch (error: unknown) {
        if (error instanceof AptosApiError) {
          parseAPIErrorAndToast(network, error);
        }
      }
    },
    [adapterSignAndSubmitTxn, client, network]
  );

  const signAndSubmitTransaction = useCallback(
    async (...args: Parameters<WalletContextState["signAndSubmitTransaction"]>) => {
      const transaction = args[0];

      try {
        transaction.data.functionArguments = transaction.data.functionArguments.map((arg) => {
          if (typeof arg === "bigint") {
            return arg.toString();
          } else {
            return arg;
          }
        });
        const res: PendingTransactionResponse = await adapterSignAndSubmitTxn(transaction);
        try {
          await client.waitForTransaction({
            transactionHash: res.hash,
          });
          toast.success("Transaction confirmed");
          return true;
        } catch (error) {
          toast.error("Transaction failed");
          console.error(error);
          return false;
        }
        //eslint-disable-next-line
      } catch (error: any) {
        if (error && error?.includes("Account not found")) {
          toast.error("You need APT balance!");
        }
      }
    },
    [adapterSignAndSubmitTxn, client]
  );

  const value: AptosContextState = {
    client,
    account,
    helper,
    signAndSubmitTransaction,
  };

  return <AptosContext.Provider value={value}>{children}</AptosContext.Provider>;
}

export const useAptos = (): AptosContextState => {
  const context = useContext(AptosContext);
  if (context == null) {
    throw new Error("useAccountContext must be used within a AccountContextProvider.");
  }
  return context;
};
