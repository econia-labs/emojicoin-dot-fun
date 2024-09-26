import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { SwapWithRewards } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toCoinTypes } from "@sdk/markets/utils";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Dispatch, type SetStateAction, useEffect, useCallback } from "react";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { STRUCT_STRINGS } from "@sdk/utils";
import { useAnimationControls } from "framer-motion";
import { RewardsAnimation } from "./RewardsAnimation";
import { toast } from "react-toastify";
import { CongratulationsToast } from "./CongratulationsToast";

export const SwapButton = ({
  inputAmount,
  isSell,
  marketAddress,
  setSubmit,
  disabled,
  geoblocked,
}: {
  inputAmount: bigint | number | string;
  isSell: boolean;
  marketAddress: AccountAddressString;
  setSubmit: Dispatch<SetStateAction<(() => Promise<void>) | null>>;
  disabled?: boolean;
  geoblocked: boolean;
}) => {
  const { t } = translationFunction();
  const { aptos, account, submit } = useAptos();
  const controls = useAnimationControls();

  const handleClick = useCallback(async () => {
    if (!account) {
      return;
    }
    const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
    const builderLambda = () =>
      SwapWithRewards.builder({
        aptosConfig: aptos.config,
        swapper: account.address,
        marketAddress,
        inputAmount: BigInt(inputAmount),
        isSell,
        typeTags: [emojicoin, emojicoinLP],
        minOutputAmount: 1n,
      });
    const res = await submit(builderLambda);
    if (res && res.response && isUserTransactionResponse(res.response)) {
      const rewardsEvent = res.response.events.find(
        (e) => e.type === STRUCT_STRINGS.LotteryWinnerEvent
      );
      if (rewardsEvent) {
        controls.start("celebration");
        toast.dark(
          <>
            <RewardsAnimation controls={controls} />
            <CongratulationsToast transactionHash={res.response.hash} />
          </>,
          {
            pauseOnFocusLoss: false,
            autoClose: 15000,
            position: "top-center",
            closeOnClick: false,
          }
        );
      }
    }
  }, [account, aptos.config, inputAmount, isSell, marketAddress, submit, controls]);

  useEffect(() => {
    setSubmit(() => handleClick);
  }, [handleClick, setSubmit]);

  return (
    <>
      <ButtonWithConnectWalletFallback geoblocked={geoblocked}>
        <Button disabled={disabled} onClick={handleClick} scale="lg">
          {t("Swap")}
        </Button>
      <RewardsAnimation controls={controls} />
      </ButtonWithConnectWalletFallback>
    </>
  );
};
