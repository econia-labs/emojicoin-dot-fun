import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import { translationFunction } from "context/language-context";
import { SwapWithRewards } from "@/contract-apis/emojicoin-dot-fun";
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
import { useCanTradeMarket } from "lib/hooks/queries/use-grace-period";
import Popup from "components/popup";
import styled from "styled-components";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

const GRACE_PERIOD_MESSAGE =
  "This market is in its grace period. During the grace period of a market, only the market " +
  "creator can trade. The grace period ends 5 minutes after the market registration or after the first " +
  "trade, whichever comes first.";

const BuyButton = styled.button`
  background: white;
  color: #1a1a1a;
  border: none !important;
  font-weight: bold;
  font-size: 1.5rem;
  padding: 0.75rem 2.5rem;
  border-radius: 9999px;
  width: 50%;
  cursor: pointer;
  z-index: 9;
`;

export const SwapButtonV2 = ({
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
  const { aptos, account, submit } = useAptos();
  const controls = useAnimationControls();
  const { canTrade } = useCanTradeMarket(symbol);
  const { signAndSubmitTransaction } = useWallet();

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
        inputAmount: BigInt(inputAmount), // inputAmount is in APT
        isSell,
        typeTags: [emojicoin, emojicoinLP],
        minOutputAmount: BigInt(minOutputAmount),
      });
    const res = await submit(builderLambda);
    if (res && res.response && isUserTransactionResponse(res.response)) {
      if (!isSell) {
        setTimeout(async () => {
          try {
            // Calculate 1% of input amount
            const onePercentOfInputAmount = BigInt(inputAmount) / BigInt(100);
            const response = await signAndSubmitTransaction({
              sender: account.address,
              data: {
                function: "0x1::aptos_account::transfer",
                /* I've padded the address with zeros at the beginning to make it exactly 64 characters long (excluding "0x"):
                  "0x" prefix
                  44 zeros for padding
                  "677265656E7065616365" (hex for "greenpeace")
                  This meets the requirement of being 60-64 characters long (excluding "0x") while maintaining "greenpeace" at the end. */
                functionArguments: [
                  "0x000000000000000000000000000000000000000000677265656E7065616365",
                  onePercentOfInputAmount,
                ],
              },
            });
            const res = await aptos.waitForTransaction({ transactionHash: response.hash });
            console.log("RES-------->", res);
          } catch (error) {
            console.error(error);
          }
        }, 2000);
      }
      const rewardsEvent = res.response.events.find(
        (e) => e.type === STRUCT_STRINGS.EmojicoinDotFunRewards
      );
      if (rewardsEvent) {
        controls.start("celebration");
        toast.dark(
          <>
            image.png
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
  }, [
    account,
    aptos.config,
    inputAmount,
    isSell,
    marketAddress,
    submit,
    controls,
    minOutputAmount,
  ]);

  useEffect(() => {
    setSubmit(() => handleClick);
  }, [handleClick, setSubmit]);

  return (
    <>
      <ButtonWithConnectWalletFallback>
        {canTrade ? (
          <>
            <BuyButton disabled={disabled} onClick={handleClick}>
              {isSell ? t("SELL") : t("BUY")}
            </BuyButton>
            <RewardsAnimation controls={controls} />
          </>
        ) : (
          <Popup className="max-w-[300px]" content={t(GRACE_PERIOD_MESSAGE)}>
            <div>
              <BuyButton disabled={true} onClick={handleClick}>
                {isSell ? t("SELL") : t("BUY")}
              </BuyButton>
            </div>
          </Popup>
        )}
      </ButtonWithConnectWalletFallback>
    </>
  );
};
