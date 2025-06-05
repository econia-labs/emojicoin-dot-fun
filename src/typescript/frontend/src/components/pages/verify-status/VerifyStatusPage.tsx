"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { motion } from "framer-motion";
import { cn } from "lib/utils/class-name";
import { useEffect, useState } from "react";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

import { useAccountAddress } from "@/hooks/use-account-address";
import useIsUserGeoblocked from "@/hooks/use-is-user-geoblocked";
import { truncateAddress } from "@/sdk/utils";

import { getIsOnCustomAllowlist } from "./get-verification-status";

const checkmarkOrX = (checkmark: boolean, className?: string) => (
  <Emoji
    className={cn("text-lg", className)}
    emojis={checkmark ? emoji("check mark button") : emoji("cross mark")}
  />
);

const ClientVerifyPage = ({
  country,
  region,
}: {
  country: string | null;
  region: string | null;
}) => {
  const accountAddress = useAccountAddress();
  const { connected, disconnect } = useWallet();
  const [galxe, setGalxe] = useState(false);
  const [customAllowlisted, setCustomAllowlisted] = useState(false);
  const geoblocked = useIsUserGeoblocked();

  useEffect(() => {
    if (!accountAddress || !connected) {
      setGalxe(false);
      setCustomAllowlisted(false);
    } else {
      getIsOnCustomAllowlist(accountAddress).then((res) => setCustomAllowlisted(res));
    }
  }, [accountAddress, connected]);

  return (
    <>
      <div
        className="absolute left-0 top-0 z-50 grid h-[100dvh] w-[100dvw] overflow-hidden bg-black"
        style={{
          gridTemplateRows: "19fr 1fr",
        }}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="justify-begin flex flex-col gap-4 text-2xl uppercase text-ec-blue">
            {connected && (
              <motion.div
                animate={{ x: 0, y: -60 }}
                initial={{ x: 2000, y: -60 }}
                className="absolute top-[50%] flex min-w-[12ch] flex-row px-2.5 hover:cursor-pointer"
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
              <div className="mt-[30ch] flex flex-col gap-1 uppercase">
                <div>
                  Wallet address:{" "}
                  <span className="text-warning">
                    {accountAddress && <span>{`${truncateAddress(accountAddress)}`}</span>}
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
