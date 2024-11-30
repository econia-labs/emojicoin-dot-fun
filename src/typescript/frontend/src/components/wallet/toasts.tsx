import {
  AptosApiError,
  NetworkToChainId,
  NetworkToNetworkName,
  NetworkToNodeAPI,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { type NetworkInfo } from "@aptos-labs/wallet-adapter-react";
import { PeriodDuration } from "@sdk/const";
import { getPeriodStartTimeFromTime, truncateAddress } from "@sdk/utils/misc";
import { APTOS_NETWORK } from "lib/env";
import { toast } from "react-toastify";
import { ExplorerLink } from "components/link/component";
import { DEFAULT_TOAST_CONFIG } from "const";

const debouncedToastKey = (s: string, debouncePeriod: PeriodDuration) => {
  const periodBoundary = getPeriodStartTimeFromTime(
    BigInt(new Date().getTime() * 1000),
    debouncePeriod
  );
  return `${s}-${Number(periodBoundary)}`;
};

export const checkNetworkAndToast = (
  network: NetworkInfo | null,
  notifyIfDisconnected = true
): network is NetworkInfo => {
  if (!network) {
    if (!notifyIfDisconnected) {
      toast.info("Please connect your wallet.", {
        ...DEFAULT_TOAST_CONFIG,
        toastId: debouncedToastKey("connect-wallet", PeriodDuration.PERIOD_1M),
      });
    }
    return false;
  }
  if (network.name.toLowerCase() === "localhost" && APTOS_NETWORK === "local") {
    return true;
  }
  const networkName = NetworkToNetworkName[APTOS_NETWORK];
  const normalizedLocalWalletNetwork = (network.url ?? "")
    .toLowerCase()
    .replaceAll("127.0.0.1", "localhost");
  const normalizedLocalApplicationNetwork = NetworkToNodeAPI[networkName]
    .toLowerCase()
    .replaceAll("127.0.0.1", "localhost")
    .replaceAll("/v1", "")
    .replaceAll("v1", "");
  const isUsingLocalhost = normalizedLocalWalletNetwork === normalizedLocalApplicationNetwork;
  if (
    !isUsingLocalhost &&
    network.name !== APTOS_NETWORK &&
    typeof network.name !== "undefined" &&
    Number(network.chainId ?? -1) !== NetworkToChainId[APTOS_NETWORK]
  ) {
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
      ...DEFAULT_TOAST_CONFIG,
      toastId: debouncedToastKey("network-warning", PeriodDuration.PERIOD_1M),
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
        ...DEFAULT_TOAST_CONFIG,
        toastId: debouncedToastKey("account-not-found", PeriodDuration.PERIOD_1M),
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
            {truncateAddress(response.hash, false)}
          </ExplorerLink>
        </div>
      </div>
    </>
  );
  toast.success(message, {
    ...DEFAULT_TOAST_CONFIG,
    toastId: debouncedToastKey("transaction-success", PeriodDuration.PERIOD_1M),
    className: "cursor-text",
    closeOnClick: false,
  });
};
