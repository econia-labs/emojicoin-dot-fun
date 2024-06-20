import {
  AptosApiError,
  type Aptos,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { type NetworkInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { toast } from "react-toastify";

import { APTOS_NETWORK } from "lib/env";
import { type EntryFunctionTransactionBuilder } from "@sdk/emojicoin_dot_fun/payload-builders";
import { getAptos } from "lib/utils/aptos-client";
import { checkNetworkAndToast, parseAPIErrorAndToast, successfulTransactionToast } from "./toasts";
import { useEventStore } from "context/websockets-context";
import { filterNonContractEvents } from "@store/event-utils";

type WalletContextState = ReturnType<typeof useWallet>;
export type SubmissionResponse = Promise<{
  response: PendingTransactionResponse | UserTransactionResponse | null;
  error: unknown;
} | null>;

export type AptosContextState = {
  aptos: Aptos;
  submit: (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => SubmissionResponse;
  signThenSubmit: (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => SubmissionResponse;
  account: WalletContextState["account"];
};

export const AptosContext = createContext<AptosContextState | undefined>(undefined);

export function AptosContextProvider({ children }: PropsWithChildren) {
  const {
    signAndSubmitTransaction: adapterSignAndSubmitTxn,
    account,
    network,
    submitTransaction,
    signTransaction,
  } = useWallet();
  const pushEvents = useEventStore((state) => state.pushEvents);

  const aptos = useMemo(() => {
    if (checkNetworkAndToast(network)) {
      return getAptos(network.name);
    }
    return getAptos(APTOS_NETWORK);
  }, [network]);

  const handleTransactionSubmission = useCallback(
    async (
      network: NetworkInfo,
      trySubmit: () => Promise<{ aptos: Aptos; res: PendingTransactionResponse }>
    ) => {
      let response: PendingTransactionResponse | UserTransactionResponse | null = null;
      let error: unknown;
      try {
        const { aptos, res } = await trySubmit();
        response = res;
        try {
          const awaitedResponse = (await aptos.waitForTransaction({
            transactionHash: res.hash,
          })) as UserTransactionResponse;
          successfulTransactionToast(awaitedResponse, network);
          response = awaitedResponse;
        } catch (e) {
          toast.error("Transaction failed");
          console.error(e);
          error = e;
        }
      } catch (e: unknown) {
        if (e instanceof AptosApiError) {
          parseAPIErrorAndToast(network, e);
        } else {
          console.error(e);
        }
        error = e;
      }
      // Store any relevant events in the state event store for all components to see.
      const events = filterNonContractEvents({ response, error });
      pushEvents(events);
      return { response, error };
    },
    [pushEvents]
  );

  const submit = useCallback(
    async (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => {
      if (checkNetworkAndToast(network, true)) {
        const trySubmit = async () => {
          const builder = await builderFn();
          const input = builder.payloadBuilder.toInputPayload();
          return adapterSignAndSubmitTxn(input).then((res) => ({
            aptos: builder.aptos,
            res,
          }));
        };

        return await handleTransactionSubmission(network, trySubmit);
      }
      return null;
    },
    [network, handleTransactionSubmission, adapterSignAndSubmitTxn]
  );

  // To manually enforce explicit gas options, we can use this transaction submission flow.
  // Note that you need to pass the options to the builder, not here. It's possible to do it here, but it's
  // unnecessary to support that and I'm not gonna write the code for it.
  const signThenSubmit = useCallback(
    async (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => {
      if (checkNetworkAndToast(network, true)) {
        const trySubmit = async () => {
          const builder = await builderFn();
          const senderAuthenticator = await signTransaction(builder.rawTransactionInput);
          return submitTransaction({
            transaction: builder.rawTransactionInput,
            senderAuthenticator,
          }).then((res) => ({
            aptos: builder.aptos,
            res,
          }));
        };
        return await handleTransactionSubmission(network, trySubmit);
      }
      return null;
    },
    [network, handleTransactionSubmission, signTransaction, submitTransaction]
  );

  const value: AptosContextState = {
    aptos,
    account,
    submit,
    signThenSubmit,
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
