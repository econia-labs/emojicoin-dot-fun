import {
  AptosApiError,
  NetworkToChainId,
  NetworkToNetworkName,
  NetworkToNodeAPI,
  type UserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import type { NetworkInfo } from "@aptos-labs/wallet-adapter-react";
import { ExplorerLink } from "components/explorer-link/ExplorerLink";
import { DEFAULT_TOAST_CONFIG } from "const";
import { APTOS_NETWORK } from "lib/env";
import { toast } from "react-toastify";

import { PeriodDuration } from "@/sdk/const";
import { ARENA_MODULE_NAME, isEntryFunctionUserTransactionResponse } from "@/sdk/index";
import { getPeriodStartTimeFromTime, truncateAddress } from "@/sdk/utils/misc";

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

export const crankedArenaMeleeToast = (response: UserTransactionResponse, network: NetworkInfo) => {
  if (!isEntryFunctionUserTransactionResponse(response))
    throw new Error(
      "This should never occur. It's just a type guard assertion to narrow the type."
    );
  const tryingToEnter = response.payload.function.endsWith(`::${ARENA_MODULE_NAME}::enter`);
  const message = (
    <div className="flex flex-col gap-[1em] !letter-spacing-[1em]">
      <div className="text-xl text-white text-center">You just cranked the melee!</div>
      <div className="text-[1em] font-forma text-lighter-gray leading-6">
        In order for the next melee to start, a user has to crank the package. You happened to be
        the first one to crank the melee!
      </div>
      <div className="text-[1em] font-forma text-lighter-gray leading-6">
        {tryingToEnter ? (
          <>
            <span>
              As a result,{" "}
              <span className="text-white">you were not entered into the previous melee</span>, and
              no funds were moved.
            </span>
          </>
        ) : (
          <span>
            Your position was <span className="text-white">successfully</span> exited.
          </span>
        )}
      </div>
      <div className="inline text-lighter-gray">
        {"View the transaction here: "}
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
  );
  toast.dark(message, {
    ...DEFAULT_TOAST_CONFIG,
    pauseOnHover: true,
    autoClose: 20000,
    toastId: debouncedToastKey("cranked", PeriodDuration.PERIOD_15S),
    className: "cursor-text",
    closeOnClick: true,
  });
};
