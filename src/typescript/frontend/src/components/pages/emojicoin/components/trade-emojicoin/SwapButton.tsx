import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { SwapWithRewards } from "@/contract-apis/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toCoinTypes } from "@sdk/markets/utils";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Dispatch, type SetStateAction, useEffect, useCallback, useMemo } from "react";
import { isUserTransactionResponse, type TypeTag } from "@aptos-labs/ts-sdk";
import { STRUCT_STRINGS } from "@sdk/utils";
import { useAnimationControls } from "framer-motion";
import { RewardsAnimation } from "./RewardsAnimation";
import { toast } from "react-toastify";
import { CongratulationsToast } from "./CongratulationsToast";
import { useCanTradeMarket } from "lib/hooks/queries/use-grace-period";
import Popup from "components/popup";
import { useTransactionBuilder } from "lib/hooks/use-transaction-builder";

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
  const { account, submit } = useAptos();
  const controls = useAnimationControls();
  const { canTrade } = useCanTradeMarket(symbol);

  const memoizedArgs = useMemo(() => {
    if (!account?.address) {
      return null;
    }
    const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
    return {
      swapper: account.address,
      marketAddress,
      inputAmount: BigInt(inputAmount),
      isSell,
      typeTags: [emojicoin, emojicoinLP] as [TypeTag, TypeTag],
      minOutputAmount: BigInt(minOutputAmount),
    };
  }, [account?.address, marketAddress, inputAmount, isSell, minOutputAmount]);

  const transactionBuilder = useTransactionBuilder(memoizedArgs, SwapWithRewards);

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
