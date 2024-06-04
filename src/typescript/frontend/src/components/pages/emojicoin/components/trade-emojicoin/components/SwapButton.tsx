import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { Swap } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { toCoinTypes } from "@sdk/markets/utils";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export const SwapButton = ({
  inputAmount,
  isSell,
  marketAddress,
}: {
  inputAmount: bigint;
  isSell: boolean;
  marketAddress: `0x${string}`;
}) => {
  const { t } = translationFunction();
  const { aptos, account, submit } = useAptos();
  const { signAndSubmitTransaction } = useWallet();

  const handleClick = async () => {
    if (!account) {
      return;
    }
    const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
    const builderLambda = () =>
      Swap.builder({
        aptosConfig: aptos.config,
        swapper: account.address,
        marketAddress,
        inputAmount,
        isSell,
        integrator: INTEGRATOR_ADDRESS,
        integratorFeeRateBps: INTEGRATOR_FEE_RATE_BPS,
        typeTags: [emojicoin, emojicoinLP],
      });
    const res = await submit(builderLambda);
    console.warn(res);
  };

  return (
    <ButtonWithConnectWalletFallback>
      <Button onClick={handleClick} scale="lg">
        {t("Swap")}
      </Button>
    </ButtonWithConnectWalletFallback>
  );
};
