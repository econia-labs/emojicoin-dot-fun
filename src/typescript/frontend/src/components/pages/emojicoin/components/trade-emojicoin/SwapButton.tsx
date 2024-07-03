import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { Swap } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { toCoinTypes } from "@sdk/markets/utils";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Dispatch, type SetStateAction, useEffect, useCallback } from "react";

export const SwapButton = ({
  inputAmount,
  isSell,
  marketAddress,
  setSubmit,
}: {
  inputAmount: bigint | number | string;
  isSell: boolean;
  marketAddress: AccountAddressString;
  setSubmit: Dispatch<SetStateAction<(() => Promise<void>) | null>>;
}) => {
  const { t } = translationFunction();
  const { aptos, account, submit } = useAptos();

  const handleClick = useCallback(async () => {
    if (!account) {
      return;
    }
    const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
    const builderLambda = () =>
      Swap.builder({
        aptosConfig: aptos.config,
        swapper: account.address,
        marketAddress,
        inputAmount: BigInt(inputAmount),
        isSell,
        integrator: INTEGRATOR_ADDRESS,
        integratorFeeRateBps: INTEGRATOR_FEE_RATE_BPS,
        typeTags: [emojicoin, emojicoinLP],
      });
    await submit(builderLambda);
  }, [account, aptos.config, inputAmount, isSell, marketAddress, submit]);

  useEffect(() => {
    setSubmit(() => handleClick);
  }, [handleClick, setSubmit]);

  return (
    <ButtonWithConnectWalletFallback>
      <Button onClick={handleClick} scale="lg">
        {t("Swap")}
      </Button>
    </ButtonWithConnectWalletFallback>
  );
};
