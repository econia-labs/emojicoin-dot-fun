"use client";

import { type AccountInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCallback, useEffect, useState } from "react";
import { createSession } from "./session";
import { EXTERNAL_LINK_PROPS } from "components/link";
import { useScramble } from "use-scramble";
import { motion } from "framer-motion";

export const ClientVerifyPage = () => {
  const { account } = useAptos();
  const { connected, disconnect } = useWallet();
  const [verified, setVerified] = useState<boolean | null>(null);

  const { ref, replay } = useScramble({
    text:
      verified === true
        ? "Access Granted"
        : verified === false
          ? "Access Denied - Join Here"
          : "Verifying...",
    overdrive: false,
    overflow: true,
    speed: 0.6,
    playOnMount: true,
  });

  const { ref: backRef, replay: replayBack } = useScramble({
    text: "Back",
    overdrive: false,
    overflow: true,
    speed: 0.6,
  });

  const verify = useCallback(
    async (account: AccountInfo) => {
      const res = await createSession(account.address);
      setVerified(res);
      replay();
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  );

  useEffect(() => {
    if (connected && account) {
      verify(account);
    }
  }, [account, connected, verify]);

  useEffect(() => {
    setTimeout(() => {
      replay();
    }, 300);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [verified]);

  return (
    <>
      <div className="absolute top-0 left-0 w-[100dvw] h-[100dvh] bg-black z-50 overflow-hidden">
        <div className="flex items-center justify-center w-full h-full">
          <div className="flex flex-col justify-begin uppercase text-ec-blue gap-4 text-2xl">
            {connected && verified === false && (
              <motion.div
                onMouseEnter={replayBack}
                animate={{ x: 0, y: -60 }}
                initial={{ x: 2000, y: -60 }}
                className="absolute flex flex-row px-2.5 hover:cursor-pointer min-w-[12ch] top-[50%]"
                onClick={() => {
                  setVerified(null);
                  disconnect();
                }}
                transition={{
                  type: "just",
                  duration: 0.3,
                }}
              >
                <span>{"<<"}&nbsp;</span>
                <span ref={backRef}>Back</span>
              </motion.div>
            )}
            <ButtonWithConnectWalletFallback>
              <div className="flex flex-row uppercase">
                <span className="px-2.5">{"{"}</span>
                <a
                  ref={ref}
                  href={process.env.NEXT_PUBLIC_GALXE_CAMPAIGN_REDIRECT}
                  onMouseEnter={replay}
                  {...EXTERNAL_LINK_PROPS}
                />
                <span className="px-2.5">{"}"}</span>
              </div>
            </ButtonWithConnectWalletFallback>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClientVerifyPage;
