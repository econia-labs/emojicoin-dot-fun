import {
  type Aptos,
  AptosApiError,
  isUserTransactionResponse,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { type AccountInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  checkNetworkAndToast,
  crankedArenaMeleeToast,
  parseAPIErrorAndToast,
  successfulTransactionToast,
} from "components/wallet/toasts";
import { DEFAULT_TOAST_CONFIG } from "const";
import { useEventStore } from "context/event-store-context";
import { useAccountSequenceNumber } from "lib/hooks/use-account-sequence-number";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";

import useIsUserGeoblocked from "@/hooks/use-is-user-geoblocked";
import { useNameResolver } from "@/hooks/use-name-resolver";
import type { TypeTagInput } from "@/sdk/emojicoin_dot_fun";
import type {
  EntryFunctionTransactionBuilder,
  WalletInputTransactionData,
} from "@/sdk/emojicoin_dot_fun/payload-builders";
import { APTOS_COIN_TYPE_STRING, STRUCT_STRINGS } from "@/sdk/index";
import { sleep } from "@/sdk/utils";
import { getAptosClient } from "@/sdk/utils/aptos-client";
import { useLatestBalance } from "@/store/latest-balance";
import { globalUserTransactionStore } from "@/store/transaction/store";

import { copyAddressHelper, getFlattenedEventModelsFromResponse, setCoinTypeHelper } from "./utils";

type WalletContextState = ReturnType<typeof useWallet> & {
  account: (AccountInfo & { address: `0x${string}` }) | null;
};
type SubmissionResponse = Promise<{
  response: PendingTransactionResponse | UserTransactionResponse | null;
  error: unknown;
} | null>;

type TrackedCoinType = "apt" | "emojicoin" | "emojicoinLP";
type TransactionStatus = "idle" | "prompt" | "pending" | "success" | "error";
type ResponseType = Awaited<SubmissionResponse>;

type AptosContextState = {
  aptos: Aptos;
  submit: (input: WalletInputTransactionData | null) => SubmissionResponse;
  signThenSubmit: (
    transactionBuilder: EntryFunctionTransactionBuilder | null
  ) => SubmissionResponse;
  account: WalletContextState["account"];
  copyAddress: () => Promise<void>;
  status: TransactionStatus;
  lastResponse: ResponseType;
  lastResponseStoredAt: number;
  addressName: string;
  setEmojicoinType: (type?: TypeTagInput) => void;
  aptBalance: bigint;
  emojicoinBalance: bigint;
  emojicoinLPBalance: bigint;
  refetchBalance(coinType: TrackedCoinType, forceRefetch?: boolean): void;
};

const AptosContext = createContext<AptosContextState | undefined>(undefined);

export function AptosContextProvider({ children }: PropsWithChildren) {
  const {
    signAndSubmitTransaction: adapterSignAndSubmitTxn,
    account: untypedAccount,
    network,
    submitTransaction,
    signTransaction,
  } = useWallet();
  const account = untypedAccount as AptosContextState["account"];
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [lastResponse, setLastResponse] = useState<ResponseType>(null);
  const pushEventsFromClient = useEventStore((s) => s.pushEventsFromClient);
  const [lastResponseStoredAt, setLastResponseStoredAt] = useState(-1);
  const [emojicoinType, setEmojicoinType] = useState<string>();
  const geoblocked = useIsUserGeoblocked();
  // We could check `account?.ansName` here but it would require conditional hook logic, plus not all wallets provide it
  // so it's not really worth the extra effort and complexity.
  const addressName = useNameResolver(account?.address);

  const { emojicoin, emojicoinLP } = useMemo(() => {
    if (!emojicoinType) return { emojicoin: undefined, emojicoinLP: undefined };
    return {
      emojicoin: emojicoinType,
      emojicoinLP: `${emojicoinType}LP`,
    };
  }, [emojicoinType]);

  const aptos = useMemo(() => {
    checkNetworkAndToast(network);
    return getAptosClient();
  }, [network]);

  const { markSequenceNumberStale } = useAccountSequenceNumber(aptos, account);

  const aptHelper = useLatestBalance(account?.address, APTOS_COIN_TYPE_STRING);
  const emojicoinHelper = useLatestBalance(account?.address, emojicoin);
  const emojicoinLPHelper = useLatestBalance(account?.address, emojicoinLP);

  const copyAddress = useCallback(async () => copyAddressHelper(account), [account]);

  const handleTransactionSubmission = useCallback(
    async ({
      functionName,
      res,
    }: {
      functionName: `${string}::${string}::${string}`;
      res: PendingTransactionResponse;
    }) => {
      let response: PendingTransactionResponse | UserTransactionResponse | null = null;
      let error: unknown;
      if (!network) {
        return {
          response: null,
          error: new Error("No valid network."),
        };
      }
      try {
        response = res;
        setStatus("pending");
        try {
          // If the transaction submission succeeds, mark the account's sequence number as stale.
          markSequenceNumberStale();
          const awaitedResponse = (await aptos.waitForTransaction({
            transactionHash: res.hash,
          })) as UserTransactionResponse;
          setStatus("success");
          // We handle the `register_market` indicators manually with the animation orchestration.
          if (!functionName.endsWith("register_market")) {
            // Toast for the crank if it's there.
            if (awaitedResponse.events.find((e) => e.type === STRUCT_STRINGS.ArenaMeleeEvent)) {
              crankedArenaMeleeToast(awaitedResponse, network);
            } else {
              // Otherwise, a normal successful txn toast.
              successfulTransactionToast(awaitedResponse, network);
            }
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
          setLastResponseStoredAt(Date.now());
          sleep(DEFAULT_TOAST_CONFIG.autoClose).then(() => setStatus("idle"));
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
      if (response && isUserTransactionResponse(response)) {
        globalUserTransactionStore.getState().pushTransactions(response);
        const flattenedEvents = getFlattenedEventModelsFromResponse(response);
        pushEventsFromClient(flattenedEvents, true);
      }

      return { response, error };
    },
    [markSequenceNumberStale, pushEventsFromClient, aptos, network]
  );

  const submit: AptosContextState["submit"] = useCallback(
    async (input) => {
      if (geoblocked || !input) return null;
      if (checkNetworkAndToast(network, true)) {
        setStatus("prompt");
        const { functionName, res } = await adapterSignAndSubmitTxn(input).then((res) => ({
          functionName: input.data.function,
          res,
        }));
        return await handleTransactionSubmission({ functionName, res });
      }
      return null;
    },
    [network, handleTransactionSubmission, adapterSignAndSubmitTxn, geoblocked]
  );

  // To manually enforce explicit gas options, we can use this transaction submission flow.
  // Note that you need to pass the options to the builder, not here. It's possible to do it here, but it's
  // unnecessary to support that and I'm not gonna write the code for it.
  const signThenSubmit: AptosContextState["signThenSubmit"] = useCallback(
    async (transactionBuilder) => {
      if (geoblocked || !transactionBuilder) return null;
      if (checkNetworkAndToast(network, true)) {
        setStatus("prompt");
        const senderAuthenticator = await signTransaction(transactionBuilder.rawTransactionInput);
        const { functionName, res } = await submitTransaction({
          transaction: transactionBuilder.rawTransactionInput,
          senderAuthenticator,
        }).then((res) => ({
          functionName: [
            transactionBuilder.payloadBuilder.moduleAddress,
            transactionBuilder.payloadBuilder.moduleName,
            transactionBuilder.payloadBuilder.functionName,
          ].join("::") as `${string}::${string}::${string}`,
          res,
        }));

        return await handleTransactionSubmission({ functionName, res });
      }
      return null;
    },
    [network, handleTransactionSubmission, signTransaction, submitTransaction, geoblocked]
  );

  const value: AptosContextState = {
    aptos,
    account,
    submit,
    signThenSubmit,
    copyAddress,
    status,
    lastResponse,
    lastResponseStoredAt,
    aptBalance: aptHelper.balance,
    emojicoinBalance: emojicoinHelper.balance,
    emojicoinLPBalance: emojicoinLPHelper.balance,
    addressName,
    setEmojicoinType: (type?: TypeTagInput) => setCoinTypeHelper(setEmojicoinType, type),
    refetchBalance: (coinType: TrackedCoinType, forceRefetch?: boolean) => {
      if (coinType === "apt") aptHelper.refetchBalance(forceRefetch);
      else if (coinType === "emojicoin") emojicoinHelper.refetchBalance(forceRefetch);
      else if (coinType === "emojicoinLP") emojicoinLPHelper.refetchBalance(forceRefetch);
      else throw new Error(`Invalid coin type: ${coinType}`);
    },
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
