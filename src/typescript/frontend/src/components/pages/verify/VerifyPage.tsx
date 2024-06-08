"use client";

import { type AccountInfo, useWallet } from "@aptos-labs/wallet-adapter-react";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCallback, useEffect, useState } from "react";
import { darkColors } from "theme";
import { createSession } from "./session";
import { EXTERNAL_LINK_PROPS } from "components/link";
import { useScramble } from "use-scramble";

export const ClientVerifyPage = () => {
  const { account } = useAptos();
  const { connected } = useWallet();
  const [enabled, setEnabled] = useState(false);
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
    onAnimationStart: () => setEnabled(false),
    onAnimationEnd: () => setEnabled(true),
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

  const handleReplay = useCallback(() => {
    if (enabled) {
      replay();
    }
  }, [enabled, replay]);

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: darkColors.black,
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100vw",
            height: "100vh",
            textTransform: "uppercase",
            color: darkColors.econiaBlue,
            gap: "1rem",
            fontSize: "1.5rem",
          }}
        >
          <ButtonWithConnectWalletFallback>
            <div className="flex flex-row">
              <span className="px-2.5">{"{"}</span>
              <a
                ref={ref}
                href={process.env.NEXT_PUBLIC_GALXE_CAMPAIGN_REDIRECT}
                className="uppercase"
                onMouseOver={handleReplay}
                {...EXTERNAL_LINK_PROPS}
              />
              <span className="px-2.5">{"}"}</span>
            </div>
          </ButtonWithConnectWalletFallback>
        </div>
      </div>
    </>
  );
};

export default ClientVerifyPage;
