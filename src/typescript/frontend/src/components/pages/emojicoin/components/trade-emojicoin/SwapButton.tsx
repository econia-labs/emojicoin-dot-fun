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
import { useGracePeriod } from "lib/hooks/queries/use-grace-period";
import Popup from "components/popup";

export const SwapButton = ({
  inputAmount,
  isSell,
  marketAddress,
  setSubmit,
  disabled,
  geoblocked,
  symbol,
}: {
  inputAmount: bigint | number | string;
  isSell: boolean;
  marketAddress: AccountAddressString;
  setSubmit: Dispatch<SetStateAction<(() => Promise<void>) | null>>;
  disabled?: boolean;
  geoblocked: boolean;
  symbol: string;
}) => {
  const { t } = translationFunction();
  const { aptos, account, submit } = useAptos();
  const controls = useAnimationControls();
  const { isLoading, data } = useGracePeriod(symbol);

  const isInGracePeriod = isLoading ? false : !data!.gracePeriodOver;
  // If data not loaded yet, use user address as registrant address in order to not prevent the user from trying to trade.
  const registrantAddress = data?.flag?.marketRegistrant ?? account?.address;

  const canTrade = !isInGracePeriod || registrantAddress === account?.address;

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
  }, [account, aptos.config, inputAmount, isSell, marketAddress, submit, controls]);

  useEffect(() => {
    setSubmit(() => handleClick);
  }, [handleClick, setSubmit]);

  return (
    <>
      <ButtonWithConnectWalletFallback geoblocked={geoblocked}>
        {canTrade ? (
          <>
            <Button disabled={disabled} onClick={handleClick} scale="lg">
              {t("Swap")}
            </Button>
            <RewardsAnimation controls={controls} />
          </>
        ) : (
          <Popup className="max-w-[300px]" content="This market is in its grace period. During the grace period of a market, only the market creator can trade. The grace period ends 5 minutes after the market registration, of after the first trade, whichever comes first.">
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
