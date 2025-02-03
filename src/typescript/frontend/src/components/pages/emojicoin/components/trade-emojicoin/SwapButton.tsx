import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Dispatch, type SetStateAction, useEffect, useCallback } from "react";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { STRUCT_STRINGS } from "@sdk/utils";
import { useAnimationControls } from "framer-motion";
import { RewardsAnimation } from "./RewardsAnimation";
import { toast } from "react-toastify";
import { CongratulationsToast } from "./CongratulationsToast";
import { useCanTradeMarket } from "lib/hooks/queries/use-grace-period";
import Popup from "components/popup";
import { useSwapTransactionBuilder } from "lib/hooks/transaction-builders/use-swap-builder";

const GRACE_PERIOD_MESSAGE =
  "This market is in its grace period. During the grace period of a market, only the market " +
  "creator can trade. The grace period ends 5 minutes after the market registration or after the first " +
  "trade, whichever comes first.";

export const SwapButton = ({
  inputAmount,
  isSell,
  marketAddress,
  setSubmit,
  disabled,
  symbol,
  minOutputAmount,
}: {
  inputAmount: bigint | number | string;
  isSell: boolean;
  marketAddress: AccountAddressString;
  setSubmit: Dispatch<SetStateAction<(() => Promise<void>) | null>>;
  disabled?: boolean;
  symbol: string;
  minOutputAmount: bigint | number | string;
}) => {
  const { t } = translationFunction();
  const { submit } = useAptos();
  const controls = useAnimationControls();
  const { canTrade } = useCanTradeMarket(symbol);

  const transactionBuilder = useSwapTransactionBuilder(
    marketAddress,
    inputAmount,
    isSell,
    minOutputAmount
  );

  const handleClick = useCallback(async () => {
    const res = await submit(transactionBuilder);

    if (res && res.response && isUserTransactionResponse(res.response)) {
      const rewardsEvent = res.response.events.find(
        (e) => e.type === STRUCT_STRINGS.EmojicoinDotFunRewards
      );
      if (rewardsEvent) {
        controls.start("celebration");
        toast.dark(
          <>
            <RewardsAnimation controls={controls} />
            <CongratulationsToast
              transactionHash={res.response.hash}
              amount={rewardsEvent.data.octas_reward_amount}
            />
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
  }, [transactionBuilder, controls, submit]);

  useEffect(() => {
    setSubmit(() => handleClick);
  }, [handleClick, setSubmit]);

  return (
    <>
      <ButtonWithConnectWalletFallback>
        {canTrade ? (
          <>
            <Button disabled={disabled || !transactionBuilder} onClick={handleClick} scale="lg">
              {t("Swap")}
            </Button>
            <RewardsAnimation controls={controls} />
          </>
        ) : (
          <Popup className="max-w-[300px]" content={t(GRACE_PERIOD_MESSAGE)}>
            <div>
              <Button disabled={true} onClick={handleClick} scale="lg">
                {t("Swap")}
              </Button>
            </div>
          </Popup>
        )}
      </ButtonWithConnectWalletFallback>
    </>
  );
};
