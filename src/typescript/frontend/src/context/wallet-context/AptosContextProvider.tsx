import {
  AccountAddress,
  APTOS_COIN,
  AptosApiError,
  isUserTransactionResponse,
  parseTypeTag,
  type Aptos,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { type NetworkInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";

import { type EntryFunctionTransactionBuilder } from "@sdk/emojicoin_dot_fun/payload-builders";
import { getAptos } from "lib/utils/aptos-client";
import {
  checkNetworkAndToast,
  parseAPIErrorAndToast,
  successfulTransactionToast,
} from "components/wallet/toasts";
import { useEventStore } from "context/websockets-context";
import { getEvents } from "@sdk/emojicoin_dot_fun";
import { DEFAULT_TOAST_CONFIG } from "const";
import { sleep, UnitOfTime } from "@sdk/utils";
import { useWalletBalance } from "lib/hooks/queries/use-wallet-balance";
import { getNewCoinBalanceFromChanges } from "utils/parse-changes-for-balances";

type WalletContextState = ReturnType<typeof useWallet>;
export type SubmissionResponse = Promise<{
  response: PendingTransactionResponse | UserTransactionResponse | null;
  error: unknown;
} | null>;

export type TransactionStatus = "idle" | "prompt" | "pending" | "success" | "error";
export type ResponseType = Awaited<SubmissionResponse>;
export type EntryFunctionNames =
  | "chat"
  | "swap"
  | "register_market"
  | "provide_liquidity"
  | "remove_liquidity";

export type AptosContextState = {
  aptos: Aptos;
  submit: (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => SubmissionResponse;
  signThenSubmit: (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => SubmissionResponse;
  account: WalletContextState["account"];
  copyAddress: () => void;
  status: TransactionStatus;
  lastResponse: ResponseType;
  aptBalance: number;
  isFetchingBalance: boolean;
  forceRefetchBalance: () => void;
  refetchBalanceIfStale: () => void;
  setBalance: (n: number) => void;
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
  const pushEventFromClient = useEventStore((state) => state.pushEventFromClient);
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [lastResponse, setLastResponse] = useState<ResponseType>(null);

  const aptos = useMemo(() => {
    if (checkNetworkAndToast(network)) {
      return getAptos();
    }
    return getAptos();
  }, [network]);

  const {
    balance: aptBalance,
    setBalance,
    isFetching: isFetchingBalance,
    forceRefetch,
    refetchIfStale,
  } = useWalletBalance({
    aptos,
    accountAddress: account?.address,
    coinType: parseTypeTag(APTOS_COIN),
  });

  useEffect(() => {
    if (account?.address) {
      forceRefetch();
    }
  }, [account, forceRefetch]);

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      toast.success("Copied address to clipboard! 📋", {
        pauseOnFocusLoss: false,
        autoClose: 2000,
      });
    } catch {
      toast.error("Failed to copy address to clipboard. 😓", {
        pauseOnFocusLoss: false,
        autoClose: 2000,
      });
    }
  }, [account?.address]);

  // Any time the lastResponse changes, we will parse the write set changes to update the balance as long as
  // the sender of the transaction is still the currently connected account.
  useEffect(() => {
    const response = lastResponse?.response;
    if (response && isUserTransactionResponse(response)) {
      const sender = AccountAddress.from(response.sender);
      if (account && AccountAddress.from(account.address).equals(sender)) {
        const changes = response.changes;
        const newAptBalance = getNewCoinBalanceFromChanges({
          changes,
          userAddress: sender,
          coinType: parseTypeTag(APTOS_COIN),
        });
        setBalance(Number(newAptBalance));
      }
    }
  }, [lastResponse, aptBalance, setBalance, account]);

  const handleTransactionSubmission = useCallback(
    async (
      network: NetworkInfo,
      trySubmit: () => Promise<{
        aptos: Aptos;
        functionName: EntryFunctionNames;
        res: PendingTransactionResponse;
      }>
    ) => {
      let response: PendingTransactionResponse | UserTransactionResponse | null = null;
      let error: unknown;
      try {
        const { aptos, res, functionName } = await trySubmit();
        response = res;
        setStatus("pending");
        try {
          const awaitedResponse = (await aptos.waitForTransaction({
            transactionHash: res.hash,
          })) as UserTransactionResponse;
          setStatus("success");
          // We handle the `register_market` indicators manually with the animation orchestration.
          if (functionName !== "register_market") {
            successfulTransactionToast(awaitedResponse, network);
          }
          response = awaitedResponse;
        } catch (e) {
          setStatus("error");
          toast.error("Transaction failed", DEFAULT_TOAST_CONFIG);
          console.error(e);
          error = e;
        } finally {
          setLastResponse({
            response,
            error: null,
          });
          sleep(DEFAULT_TOAST_CONFIG.autoClose, UnitOfTime.Milliseconds).then(() => {
            setStatus("idle");
          });
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
      const events = getEvents(response);
      const flattenedEvents = [
        ...events.globalStateEvents,
        ...events.marketRegistrationEvents,
        ...events.periodicStateEvents,
        ...events.swapEvents,
        ...events.chatEvents,
        ...events.stateEvents,
        ...events.liquidityEvents,
      ];
      flattenedEvents.forEach(pushEventFromClient);

      return { response, error };
    },
    [pushEventFromClient]
  );

  const submit = useCallback(
    async (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => {
      if (checkNetworkAndToast(network, true)) {
        const trySubmit = async () => {
          const builder = await builderFn();
          setStatus("prompt");
          const input = builder.payloadBuilder.toInputPayload();
          return adapterSignAndSubmitTxn(input).then((res) => ({
            aptos: builder.aptos,
            functionName: builder.payloadBuilder.functionName as EntryFunctionNames,
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
          setStatus("prompt");
          const senderAuthenticator = await signTransaction(builder.rawTransactionInput);
          return submitTransaction({
            transaction: builder.rawTransactionInput,
            senderAuthenticator,
          }).then((res) => ({
            aptos: builder.aptos,
            functionName: builder.payloadBuilder.functionName as EntryFunctionNames,
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
    copyAddress,
    status,
    lastResponse,
    aptBalance,
    isFetchingBalance,
    forceRefetchBalance: forceRefetch,
    refetchBalanceIfStale: refetchIfStale,
    setBalance,
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
