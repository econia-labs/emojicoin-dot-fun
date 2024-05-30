import { AptosApiError, type UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { type NetworkInfo } from "@aptos-labs/wallet-adapter-react";
import { CandlestickResolution } from "@sdk/const";
import { getCurrentPeriodBoundary } from "@sdk/utils/misc";
import { APTOS_NETWORK } from "lib/env";
import { toast } from "react-toastify";
import { ExplorerLink } from "components/link/component";

const debouncedToastKey = (s: string, debouncePeriod: CandlestickResolution) => {
  const periodBoundary = getCurrentPeriodBoundary(debouncePeriod);
  return `${s}-${periodBoundary}`;
};

export const checkNetworkAndToast = (
  network: NetworkInfo | null,
  ignoreNull = true
): network is NetworkInfo => {
  if (!network) {
    if (!ignoreNull) {
      toast.info("Please connect your wallet.", {
        toastId: debouncedToastKey("connect-wallet", CandlestickResolution.PERIOD_15S),
      });
    }
    return false;
  }
  if (network.name !== APTOS_NETWORK && typeof network.name !== "undefined") {
    const message = (
      <div className="flex flex-col">
        <div>
          <div className="inline">
            {"Your wallet network is set to "}
            <p className="font-forma inline font-bold text-orange-500 drop-shadow-text">
              {network.name}
            </p>
            {" but this"}
          </div>
          <div className="inline">
            {" dapp is using the "}{" "}
            <p className="font-forma inline font-bold text-orange-500 drop-shadow-text">
              {APTOS_NETWORK}
            </p>
            {" network."}
          </div>
        </div>
      </div>
    );
    toast.warning(message, {
      toastId: debouncedToastKey("network-warning", CandlestickResolution.PERIOD_15S),
    });
  }
  return true;
};

export const parseAPIErrorAndToast = (network: NetworkInfo, error: AptosApiError) => {
  if (error instanceof AptosApiError) {
    if (error.data?.error_code === "account_not_found") {
      const message = (
        <div className="flex flex-col">
          <div className="inline">
            {"Your account doesn't exist on the "}
            <p className="font-forma inline font-bold text-orange-500 drop-shadow-text">
              {network.name}
            </p>
            {" network. Have you created an account?"}
          </div>
        </div>
      );
      toast.error(message, {
        toastId: debouncedToastKey("account-not-found", CandlestickResolution.PERIOD_15S),
      });
    }
  }
};

export const successfulTransactionToast = (
  response: UserTransactionResponse,
  network: NetworkInfo
) => {
  const message = (
    <>
      <div className="flex flex-col cursor-text">
        <div className="inline">
          {"Transaction confirmed! "}
          <ExplorerLink
            className="font-forma inline font-bold text-orange-500 drop-shadow-text"
            network={network.name}
            value={response.hash}
            type="transaction"
          >
            {response.hash}
          </ExplorerLink>
        </div>
      </div>
    </>
  );
  toast.success(message, {
    toastId: debouncedToastKey("transaction-success", CandlestickResolution.PERIOD_1S),
    className: "cursor-text",
    closeOnClick: false,
    autoClose: 8000,
  });
};
