import {
  APTOS_COIN,
  AptosApiError,
  isUserTransactionResponse,
  type Aptos,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { toast } from "react-toastify";
import {
  type WalletInputTransactionData,
  type EntryFunctionTransactionBuilder,
} from "@sdk/emojicoin_dot_fun/payload-builders";
import {
  checkNetworkAndToast,
  parseAPIErrorAndToast,
  successfulTransactionToast,
} from "components/wallet/toasts";
import { useEventStore } from "context/event-store-context";
import { type TypeTagInput } from "@sdk/emojicoin_dot_fun";
import { DEFAULT_TOAST_CONFIG } from "const";
import { sleep } from "@sdk/utils";
import { useWalletBalance } from "lib/hooks/queries/use-wallet-balance";
import useIsUserGeoblocked from "@hooks/use-is-user-geoblocked";
import { getAptosClient } from "@sdk/utils/aptos-client";
import { useNameResolver } from "@hooks/use-name-resolver";
import {
  copyAddressHelper,
  getFlattenedEventModelsFromResponse,
  setBalancesFromWriteset,
  setCoinTypeHelper,
} from "./utils";
import { useAccountSequenceNumber } from "lib/hooks/use-account-sequence-number";

type WalletContextState = ReturnType<typeof useWallet>;
export type SubmissionResponse = Promise<{
  response: PendingTransactionResponse | UserTransactionResponse | null;
  error: unknown;
} | null>;

export type TrackedCoinType = "apt" | "emojicoin" | "emojicoinLP";
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
  submit: (input: WalletInputTransactionData | null) => SubmissionResponse;
  signThenSubmit: (
    transactionBuilder: EntryFunctionTransactionBuilder | null
  ) => SubmissionResponse;
  account: WalletContextState["account"];
  copyAddress: () => void;
  status: TransactionStatus;
  lastResponse: ResponseType;
  lastResponseStoredAt: number;
  addressName: string;
  setEmojicoinType: (type?: TypeTagInput) => void;
  aptBalance: bigint;
  emojicoinBalance: bigint;
  emojicoinLPBalance: bigint;
  isFetching(coinType: TrackedCoinType): boolean;
  forceRefetch(coinType: TrackedCoinType): void;
  refetchIfStale(coinType: TrackedCoinType): void;
  setBalance(coinType: TrackedCoinType, n: bigint): void;
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

  const aptHelper = useWalletBalance({ aptos, account, coinType: APTOS_COIN });
  const emojicoinHelper = useWalletBalance({ aptos, account, coinType: emojicoin });
  const emojicoinLPHelper = useWalletBalance({ aptos, account, coinType: emojicoinLP });

  const copyAddress = useCallback(async () => copyAddressHelper(account), [account]);

  const parseChangesAndSetBalances = useCallback(
    (response: UserTransactionResponse) => {
      setBalancesFromWriteset({
        response,
        account,
        emojicoin,
        emojicoinLP,
        setAptBalance: aptHelper.setBalance,
        setEmojicoinBalance: emojicoinHelper.setBalance,
        setEmojicoinLPBalance: emojicoinLPHelper.setBalance,
      });
    },
    [account, emojicoin, emojicoinLP, aptHelper, emojicoinHelper, emojicoinLPHelper]
  );

  const handleTransactionSubmission = useCallback(
    async ({
      functionName,
      res,
    }: {
      functionName: EntryFunctionNames;
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
        const flattenedEvents = getFlattenedEventModelsFromResponse(response);
        pushEventsFromClient(flattenedEvents, true);
        parseChangesAndSetBalances(response);
      }

      return { response, error };
    },
    [pushEventsFromClient, parseChangesAndSetBalances, aptos, network]
  );

  const submit: AptosContextState["submit"] = useCallback(
    async (input) => {
      if (geoblocked || !input) return null;
      if (checkNetworkAndToast(network, true)) {
        setStatus("prompt");
        const { functionName, res } = await adapterSignAndSubmitTxn(input).then((res) => ({
          functionName: input.data.function.split("::").at(-1) as EntryFunctionNames,
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
          functionName: transactionBuilder.payloadBuilder.functionName as EntryFunctionNames,
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
    setBalance: (coinType: TrackedCoinType, n: bigint) => {
      if (coinType === "apt") aptHelper.setBalance(n);
      else if (coinType === "emojicoin") emojicoinHelper.setBalance(n);
      else if (coinType === "emojicoinLP") emojicoinLPHelper.setBalance(n);
      else throw new Error(`Invalid coin type: ${coinType}`);
    },
    isFetching: (coinType: TrackedCoinType) => {
      if (coinType === "apt") return aptHelper.isFetching;
      else if (coinType === "emojicoin") return emojicoinHelper.isFetching;
      else if (coinType === "emojicoinLP") return emojicoinLPHelper.isFetching;
      else throw new Error(`Invalid coin type: ${coinType}`);
    },
    forceRefetch: (coinType: TrackedCoinType) => {
      if (coinType === "apt") aptHelper.forceRefetch();
      else if (coinType === "emojicoin") emojicoinHelper.forceRefetch();
      else if (coinType === "emojicoinLP") emojicoinLPHelper.forceRefetch();
      else throw new Error(`Invalid coin type: ${coinType}`);
    },
    refetchIfStale: (coinType: TrackedCoinType) => {
      if (coinType === "apt") aptHelper.refetchIfStale();
      else if (coinType === "emojicoin") emojicoinHelper.refetchIfStale();
      else if (coinType === "emojicoinLP") emojicoinLPHelper.refetchIfStale();
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
