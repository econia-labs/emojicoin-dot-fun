import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { RegisterMarket } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { type HexInput } from "@aptos-labs/ts-sdk";
import { getAptosConfig } from "lib/utils/aptos-client";
import { INTEGRATOR_ADDRESS } from "lib/env";
import { useEffect } from "react";
import { SYMBOL_DATA } from "@sdk/emoji_data";

export const LaunchEmojicoinButton = ({ emojis }: { emojis: Array<HexInput> }) => {
  const { t } = translationFunction();
  const { account, helper } = useAptos();

  useEffect(() => {
    const emojiData = emojis.map((e) => SYMBOL_DATA.byHex(e)!);
    console.dir(emojiData);
    console.log(emojiData);
  });

  const handleClick = async () => {
    if (!account) {
      return;
    }
    const res = await helper(() =>
      RegisterMarket.builder({
        aptosConfig: getAptosConfig(),
        registrant: account.address,
        emojis,
        integrator: INTEGRATOR_ADDRESS,
      })
    );
    console.log(res);
  };

  return (
    <ButtonWithConnectWalletFallback>
      <Button onClick={handleClick} scale="lg">
        {t("Launch Emojicoin")}
      </Button>
    </ButtonWithConnectWalletFallback>
  );
};
