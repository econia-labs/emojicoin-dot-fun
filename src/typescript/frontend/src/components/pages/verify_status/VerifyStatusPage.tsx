"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { standardizeAddress, truncateAddress } from "@sdk/utils";
import { getIsOnCustomAllowlist } from "./get-verification-status";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";
import useIsUserGeoblocked from "@hooks/use-is-user-geoblocked";
import { cn } from "lib/utils/class-name";

export const checkmarkOrX = (checkmark: boolean, className?: string) => (
  <Emoji
    className={cn("text-lg", className)}
    emojis={checkmark ? emoji("check mark button") : emoji("cross mark")}
  />
);

export const ClientVerifyPage = ({
  country,
  region,
}: {
  country: string | null;
  region: string | null;
}) => {
  const { account } = useAptos();
  const { connected, disconnect } = useWallet();
  const [galxe, setGalxe] = useState(false);
  const [customAllowlisted, setCustomAllowlisted] = useState(false);
  const geoblocked = useIsUserGeoblocked();

  useEffect(() => {
    if (!account || !connected) {
      setGalxe(false);
      setCustomAllowlisted(false);
    } else {
      const address = standardizeAddress(account.address);
      getIsOnCustomAllowlist(address).then((res) => setCustomAllowlisted(res));
    }
  }, [account, connected]);

  return (
    <>
      <div
        className="absolute top-0 left-0 w-[100dvw] h-[100dvh] bg-black z-50 overflow-hidden grid"
        style={{
          gridTemplateRows: "19fr 1fr",
        }}
      >
        <div className="flex items-center justify-center w-full h-full">
          <div className="flex flex-col justify-begin uppercase text-ec-blue gap-4 text-2xl">
            {connected && (
              <motion.div
                animate={{ x: 0, y: -60 }}
                initial={{ x: 2000, y: -60 }}
                className="absolute flex flex-row px-2.5 hover:cursor-pointer min-w-[12ch] top-[50%]"
                onClick={() => {
                  disconnect();
                }}
                transition={{
                  type: "just",
                  duration: 0.3,
                }}
              >
                <span>{"<<"}&nbsp;</span>
                <span>Disconnect Wallet</span>
              </motion.div>
            )}
            <ButtonWithConnectWalletFallback forceAllowConnect={true}>
              <div className="flex flex-col uppercase mt-[30ch] gap-1">
                <div>
                  Wallet address:{" "}
                  <span className="text-warning">
                    {account && <span>{`${truncateAddress(account.address)}`}</span>}
                  </span>
                </div>
                <div>Galxe: {checkmarkOrX(galxe)}</div>
                <div>Custom allowlist: {checkmarkOrX(customAllowlisted)}</div>
                <div>Passes geoblocking: {checkmarkOrX(!geoblocked)}</div>
                <div>Country: {country ?? "unknown"}</div>
                <div>Region: {region ?? "unknown"}</div>
              </div>
            </ButtonWithConnectWalletFallback>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientVerifyPage;
