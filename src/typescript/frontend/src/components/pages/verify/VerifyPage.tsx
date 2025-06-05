"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { motion } from "framer-motion";
import { LINKS } from "lib/env";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ROUTES } from "router/routes";
import { useScramble } from "use-scramble";

import { Flex } from "@/containers";
import { useAccountAddress } from "@/hooks/use-account-address";

import { createSession } from "./session";

const ClientVerifyPage = () => {
  const accountAddress = useAccountAddress();
  const { connected, disconnect } = useWallet();
  const [verified, setVerified] = useState<boolean | null>(null);

  const { ref, replay } = useScramble({
    text:
      verified === true ? "Access Granted" : verified === false ? "Access Denied" : "Verifying...",
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
    async (accountAddress: `0x${string}`) => {
      const res = await createSession(accountAddress);
      setVerified(res);
      replay();
    },
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
    []
  );

  useEffect(() => {
    if (connected && accountAddress) {
      verify(accountAddress);
    }
  }, [accountAddress, connected, verify]);

  useEffect(() => {
    setTimeout(() => {
      replay();
    }, 300);
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [verified]);

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
            {connected && verified === false && (
              <motion.div
                onMouseEnter={replayBack}
                animate={{ x: 0, y: -60 }}
                initial={{ x: 2000, y: -60 }}
                className="absolute top-[50%] flex min-w-[12ch] flex-row px-2.5 hover:cursor-pointer"
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
              <div className="mt-[8ch] flex flex-row uppercase">
                <span className="px-2.5">{"{"}</span>
                <span ref={ref} onMouseEnter={replay} />
                <span className="px-2.5">{"}"}</span>
              </div>
            </ButtonWithConnectWalletFallback>
          </div>
        </div>
        <Flex justifyContent="center" className="w-[100dvw]">
          <Link href={LINKS?.tos ?? ROUTES["not-found"]}>
            <p className="py-4 text-[8px] font-bold uppercase display-6 md:py-6 md:text-[15px]">
              TERMS OF USE
            </p>
          </Link>
        </Flex>
      </div>
    </>
  );
};

export default ClientVerifyPage;
