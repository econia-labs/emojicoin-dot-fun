"use client";

import { type AccountInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCallback, useEffect, useState } from "react";
import { createSession } from "./session";
import { useScramble } from "use-scramble";
import { motion } from "framer-motion";
import { Flex } from "@containers";
import Link from "next/link";
import { Text } from "components/text";
import { LINKS } from "lib/env";
import { ROUTES } from "router/routes";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";

export const ClientVerifyPage: React.FC<{ geoblocked: boolean }> = ({ geoblocked }) => {
  const { account } = useAptos();
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
    async (account: AccountInfo) => {
      const res = await createSession(account.address as AccountAddressString);
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
      <div
        className="absolute top-0 left-0 w-[100dvw] h-[100dvh] bg-black z-50 overflow-hidden grid"
        style={{
          gridTemplateRows: "19fr 1fr",
        }}
      >
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
            <ButtonWithConnectWalletFallback geoblocked={geoblocked} arrow={false}>
              <div className="flex flex-row uppercase mt-[8ch]">
                <span className="px-2.5">{"{"}</span>
                <span ref={ref} onMouseEnter={replay} />
                <span className="px-2.5">{"}"}</span>
              </div>
            </ButtonWithConnectWalletFallback>
          </div>
        </div>
        <Flex justifyContent="center" className="w-[100dvw]">
          <Link href={LINKS?.tos ?? ROUTES.notFound}>
            <Text
              textScale="display6"
              $fontWeight="bold"
              fontSize={{ _: "8px", tablet: "15px" }}
              textTransform="uppercase"
              py={{ _: "16px", tablet: "24px" }}
            >
              TERMS OF USE
            </Text>
          </Link>
        </Flex>
      </div>
    </>
  );
};

export default ClientVerifyPage;
