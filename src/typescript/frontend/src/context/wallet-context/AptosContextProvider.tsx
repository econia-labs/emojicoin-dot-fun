import {
  AptosApiError,
  type Aptos,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { toast } from "react-toastify";

import { APTOS_NETWORK } from "lib/env";
import {
  type EntryFunctionPayloadBuilder,
  EntryFunctionTransactionBuilder,
} from "@sdk/emojicoin_dot_fun/payload-builders";
import { getAptos } from "lib/utils/aptos-client";
import { checkNetworkAndToast, parseAPIErrorAndToast, successfulTransactionToast } from "./toasts";

type WalletContextState = ReturnType<typeof useWallet>;

export type AptosContextState = {
  client: Aptos;
  submitWithBuilder: (
    builderFn: () => Promise<EntryFunctionPayloadBuilder | EntryFunctionTransactionBuilder>
  ) => ReturnType<WalletContextState["signAndSubmitTransaction"]>;
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

  const submitWithBuilder = useCallback(
    async (
      builderFn: () => Promise<EntryFunctionPayloadBuilder | EntryFunctionTransactionBuilder>
    ) => {
      if (checkNetworkAndToast(network, true)) {
        try {
          const builder = await builderFn();
          const input =
            builder instanceof EntryFunctionTransactionBuilder
              ? builder.payloadBuilder.toInputPayload()
              : builder.toInputPayload();
          const res: PendingTransactionResponse = await adapterSignAndSubmitTxn(input);
          try {
            const response = await client.waitForTransaction({
              transactionHash: res.hash,
            });
            successfulTransactionToast(response as UserTransactionResponse, network);
            return response;
          } catch (error) {
            toast.error("Transaction failed");
            console.error(error);
            return error;
          }
        } catch (error: unknown) {
          if (error instanceof AptosApiError) {
            parseAPIErrorAndToast(network, error);
          } else {
            console.error(error);
          }
          return error;
        }
      }

      return null;
    },
    [adapterSignAndSubmitTxn, client, network]
  );

  const value: AptosContextState = {
    client,
    account,
    submitWithBuilder,
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
