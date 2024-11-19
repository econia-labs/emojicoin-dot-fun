import {
  AccountAddress,
  APTOS_COIN,
  AptosApiError,
  isUserTransactionResponse,
  parseTypeTag,
  TypeTag,
  type Aptos,
  type PendingTransactionResponse,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { type NetworkInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import {
  createContext,
  type Dispatch,
  type PropsWithChildren,
  type SetStateAction,
  useCallback,
  useContext,
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
import { useEventStore } from "context/event-store-context";
import { type TypeTagInput } from "@sdk/emojicoin_dot_fun";
import { DEFAULT_TOAST_CONFIG } from "const";
import { sleep, UnitOfTime } from "@sdk/utils";
import { useWalletBalance } from "lib/hooks/queries/use-wallet-balance";
import {
  getAptBalanceFromChanges,
  getCoinBalanceFromChanges,
} from "@sdk/utils/parse-changes-for-balances";
import { getEventsAsProcessorModelsFromResponse } from "@sdk/mini-processor";
import { emoji } from "utils";
import useIsUserGeoblocked from "@hooks/use-is-user-geoblocked";
import { useClaimAccount } from "lib/hooks/queries/use-claim-account";
import { REWARDS_MODULE_ADDRESS } from "@sdk/const";

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
  submit: (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => SubmissionResponse;
  signThenSubmit: (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => SubmissionResponse;
  account: WalletContextState["account"];
  copyAddress: () => void;
  status: TransactionStatus;
  lastResponse: ResponseType;
  lastResponseStoredAt: number;
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
  const pushEventFromClient = useEventStore((state) => state.pushEventFromClient);
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [lastResponse, setLastResponse] = useState<ResponseType>(null);
  const [lastResponseStoredAt, setLastResponseStoredAt] = useState(-1);
  const [emojicoinType, setEmojicoinType] = useState<string | undefined>();
  const geoblocked = useIsUserGeoblocked();
  const claimAccount = useClaimAccount();

  const { emojicoin, emojicoinLP } = useMemo(() => {
    if (!emojicoinType) return { emojicoin: undefined, emojicoinLP: undefined };
    return {
      emojicoin: emojicoinType,
      emojicoinLP: `${emojicoinType}LP`,
    };
  }, [emojicoinType]);

  const aptos = useMemo(() => {
    if (checkNetworkAndToast(network)) {
      return getAptos();
    }
    return getAptos();
  }, [network]);

  const {
    balance: aptBalance,
    setBalance: setAptBalance,
    isFetching: isFetchingAptBalance,
    forceRefetch: forceRefetchAptBalance,
    refetchIfStale: refetchAptBalanceIfStale,
  } = useWalletBalance({
    aptos,
    accountAddress: account?.address,
    coinType: APTOS_COIN,
  });

  const {
    balance: emojicoinBalance,
    setBalance: setEmojicoinBalance,
    isFetching: isFetchingEmojicoinBalance,
    forceRefetch: forceRefetchEmojicoinBalance,
    refetchIfStale: refetchEmojicoinBalanceIfStale,
  } = useWalletBalance({
    aptos,
    accountAddress: account?.address,
    coinType: emojicoin,
  });

  const {
    balance: emojicoinLPBalance,
    setBalance: setEmojicoinLPBalance,
    isFetching: isFetchingEmojicoinLPBalance,
    forceRefetch: forceRefetchEmojicoinLPBalance,
    refetchIfStale: refetchEmojicoinLPBalanceIfStale,
  } = useWalletBalance({
    aptos,
    accountAddress: account?.address,
    coinType: emojicoinLP,
  });

  const copyAddress = useCallback(async () => {
    if (!account?.address) return;
    try {
      await navigator.clipboard.writeText(account.address);
      toast.success(`Copied address to clipboard! ${emoji("clipboard")}`, {
        pauseOnFocusLoss: false,
        autoClose: 2000,
      });
    } catch {
      toast.error(`Failed to copy address to clipboard. ${emoji("downcast face with sweat")}`, {
        pauseOnFocusLoss: false,
        autoClose: 2000,
      });
    }
  }, [account?.address]);

  const parseChangesAndSetBalances = useCallback(
    (response: UserTransactionResponse) => {
      const userAddress = AccountAddress.from(response.sender);
      // Return if the account is not connected or the sender of the transaction is not the currently connected account.
      if (!account || !userAddress.equals(AccountAddress.from(account.address))) return;

      const newAptBalance = getAptBalanceFromChanges(response, userAddress);
      const newEmojicoinBalance = emojicoin
        ? getCoinBalanceFromChanges({ response, userAddress, coinType: parseTypeTag(emojicoin) })
        : undefined;
      const newEmojicoinLPBalance = emojicoinLP
        ? getCoinBalanceFromChanges({ response, userAddress, coinType: parseTypeTag(emojicoinLP) })
        : undefined;
      // Update the user's balance if the coins are present in the write set changes.
      if (typeof newAptBalance !== "undefined") setAptBalance(newAptBalance);
      if (typeof newEmojicoinBalance !== "undefined") setEmojicoinBalance(newEmojicoinBalance);
      if (typeof newEmojicoinLPBalance !== "undefined")
        setEmojicoinLPBalance(newEmojicoinLPBalance);
    },
    [account, emojicoin, emojicoinLP, setAptBalance, setEmojicoinBalance, setEmojicoinLPBalance]
  );

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
          setLastResponseStoredAt(Date.now());
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
      if (response && isUserTransactionResponse(response)) {
        const models = getEventsAsProcessorModelsFromResponse(response);
        const flattenedEvents = [
          ...models.marketRegistrationEvents,
          ...models.periodicStateEvents,
          ...models.swapEvents,
          ...models.chatEvents,
          ...models.liquidityEvents,
          ...models.marketLatestStateEvents,
        ];
        flattenedEvents.forEach((e) => pushEventFromClient(e, true));
        parseChangesAndSetBalances(response);
      }

      return { response, error };
    },
    [pushEventFromClient, parseChangesAndSetBalances]
  );

  const submit = useCallback(
    async (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => {
      if (geoblocked) return null;
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
    [network, handleTransactionSubmission, adapterSignAndSubmitTxn, geoblocked]
  );

  // To manually enforce explicit gas options, we can use this transaction submission flow.
  // Note that you need to pass the options to the builder, not here. It's possible to do it here, but it's
  // unnecessarily complex.
  // Also, use this function to call functions that use a client-side fee payer (the redeem/claimKey flow).
  const signThenSubmit = useCallback(
    async (builderFn: () => Promise<EntryFunctionTransactionBuilder>) => {
      if (geoblocked) return null;
      if (checkNetworkAndToast(network, true)) {
        const trySubmit = async () => {
          const builder = await builderFn();
          setStatus("prompt");
          // Check if it's the redeem function and that the claim account exists- if so, sign it with the claim account
          // as the fee payer and send the fee payer authenticator to the submitTransaction function.
          const isRedeemFunction =
            builder.payloadBuilder.fullyQualifiedFunctionName() ===
            `${REWARDS_MODULE_ADDRESS}::emojicoin_dot_fun_claim_link::redeem`;
          const feePayerAuthenticator =
            isRedeemFunction && claimAccount
              ? claimAccount.signTransactionWithAuthenticator(builder.rawTransactionInput)
              : undefined;
          const senderAuthenticator = await signTransaction(builder.rawTransactionInput);
          return submitTransaction({
            transaction: builder.rawTransactionInput,
            senderAuthenticator,
            feePayerAuthenticator,
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
    [
      network,
      handleTransactionSubmission,
      signTransaction,
      submitTransaction,
      geoblocked,
      claimAccount,
    ]
  );

  const setCoinTypeHelper = (
    set: Dispatch<SetStateAction<string | undefined>>,
    type?: TypeTagInput
  ) => {
    if (!type) set(undefined);
    else if (typeof type === "string") {
      set(type);
    } else if (type instanceof TypeTag) {
      set(type.toString());
    } else {
      throw new Error(`Invalid type: ${type}`);
    }
  };

  const value: AptosContextState = {
    aptos,
    account,
    submit,
    signThenSubmit,
    copyAddress,
    status,
    lastResponse,
    lastResponseStoredAt,
    aptBalance,
    emojicoinBalance,
    emojicoinLPBalance,
    setEmojicoinType: (type?: TypeTagInput) => setCoinTypeHelper(setEmojicoinType, type),
    setBalance: (coinType: TrackedCoinType, n: bigint) => {
      if (coinType === "apt") setAptBalance(n);
      else if (coinType === "emojicoin") setEmojicoinBalance(n);
      else if (coinType === "emojicoinLP") setEmojicoinLPBalance(n);
      else throw new Error(`Invalid coin type: ${coinType}`);
    },
    isFetching: (coinType: TrackedCoinType) => {
      if (coinType === "apt") return isFetchingAptBalance;
      else if (coinType === "emojicoin") return isFetchingEmojicoinBalance;
      else if (coinType === "emojicoinLP") return isFetchingEmojicoinLPBalance;
      else throw new Error(`Invalid coin type: ${coinType}`);
    },
    forceRefetch: (coinType: TrackedCoinType) => {
      if (coinType === "apt") forceRefetchAptBalance();
      else if (coinType === "emojicoin") forceRefetchEmojicoinBalance();
      else if (coinType === "emojicoinLP") forceRefetchEmojicoinLPBalance();
      else throw new Error(`Invalid coin type: ${coinType}`);
    },
    refetchIfStale: (coinType: TrackedCoinType) => {
      if (coinType === "apt") refetchAptBalanceIfStale();
      else if (coinType === "emojicoin") refetchEmojicoinBalanceIfStale();
      else if (coinType === "emojicoinLP") refetchEmojicoinLPBalanceIfStale();
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
