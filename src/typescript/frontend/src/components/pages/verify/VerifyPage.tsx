"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCallback } from "react";
import { darkColors } from "theme";
import { getTimeByWeekFloored, messageToSign } from "./session-info";
import { verifySignatureAndCreateSession } from "./verify";
import { AccountAddress } from "@aptos-labs/ts-sdk";
import ConnectedInfo from "./ConnectedInfo";
import { useRouter } from "next/navigation";
import { ROUTES } from "router/routes";

export const ClientVerifyPage = () => {
  const { account } = useAptos();
  const { connected, signMessage } = useWallet();
  const router = useRouter();

  const handleClick = useCallback(async () => {
    if (!account) {
      return;
    }
    const res = await signMessage({
      address: true,
      application: false,
      chainId: false,
      message: messageToSign,
      nonce: getTimeByWeekFloored(),
    });
    const signature = res.signature.toString();
    const pubkey = account.publicKey;
    const authenticated = await verifySignatureAndCreateSession({
      pubkey,
      signature,
      address: AccountAddress.from(account.address).toString(),
    });

    if (authenticated) {
      router.push(ROUTES.home);
    }
  }, [signMessage, account, router]);

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
          textTransform: "uppercase",
          color: darkColors.econiaBlue,
          gap: "1rem",
          fontSize: "1.5rem",
        }}
      >
        <ButtonWithConnectWalletFallback>
          <ConnectedInfo connected={connected} handleClick={handleClick} className="text-ec-blue" />
        </ButtonWithConnectWalletFallback>
      </div>
    </>
  );
};

export default ClientVerifyPage;
