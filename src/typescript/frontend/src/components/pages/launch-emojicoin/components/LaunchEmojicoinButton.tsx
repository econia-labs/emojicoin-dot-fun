import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { RegisterMarket } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { type HexInput } from "@aptos-labs/ts-sdk";
import { getAptosConfig } from "lib/utils/aptos-client";
import { INTEGRATOR_ADDRESS } from "lib/env";

export const LaunchEmojicoinButton = ({ emojis }: { emojis: Array<HexInput> }) => {
  const { t } = translationFunction();
  const { account, submitWithBuilder } = useAptos();

  const handleClick = async () => {
    if (!account) {
      return;
    }
    submitWithBuilder(() =>
      RegisterMarket.builder({
        aptosConfig: getAptosConfig(),
        registrant: account.address,
        emojis,
        integrator: INTEGRATOR_ADDRESS,
      })
    );
  };

  return (
    <ButtonWithConnectWalletFallback>
      <Button onClick={handleClick} scale="lg">
        {t("Launch Emojicoin")}
      </Button>
      <Button>
        {"is this vercel? " + process.env.VERCEL === "1" + " or maybe .....? " + process.env.VERCEL}
      </Button>
    </ButtonWithConnectWalletFallback>
  );
};
