import { type Aptos, type PendingTransactionResponse } from "@aptos-labs/ts-sdk";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { createContext, type PropsWithChildren, useCallback, useContext, useMemo } from "react";
import { toast } from "react-toastify";

import { getAptos } from "@sdk/utils/aptos-client";
import { APTOS_NETWORK } from "lib/env";

type WalletContextState = ReturnType<typeof useWallet>;

export type AptosContextState = {
  aptosClient: Aptos;
  signAndSubmitTransaction: WalletContextState["signAndSubmitTransaction"];
  account: WalletContextState["account"];
};

export const AptosContext = createContext<AptosContextState | undefined>(undefined);

export function AptosContextProvider({ children }: PropsWithChildren) {
  const { signAndSubmitTransaction: adapterSignAndSubmitTxn, account, network } = useWallet();
  const aptosClient = useMemo(() => {
    if (network?.name !== APTOS_NETWORK) {
      const warningMessage = "Your wallet network is different from the dapp's network.";
      const toAvoidMessage = `To avoid undefined behavior, please set your wallet network to ${APTOS_NETWORK}`;
      toast.warning(`${warningMessage} ${toAvoidMessage}`);
    }
    return getAptos(network?.name ?? APTOS_NETWORK);
  }, [network]);

  const signAndSubmitTransaction = useCallback(
    async (...args: Parameters<WalletContextState["signAndSubmitTransaction"]>) => {
      const transaction = args[0];

      try {
        transaction.data.functionArguments = transaction.data.functionArguments.map(arg => {
          if (typeof arg === "bigint") {
            return arg.toString();
          } else {
            return arg;
          }
        });
        const res: PendingTransactionResponse = await adapterSignAndSubmitTxn(transaction);
        try {
          await aptosClient.waitForTransaction({
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
    [adapterSignAndSubmitTxn, aptosClient],
  );

  const value: AptosContextState = {
    aptosClient,
    account,
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
