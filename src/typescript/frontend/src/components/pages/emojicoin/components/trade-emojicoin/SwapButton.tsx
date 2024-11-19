import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { Redeem, SwapWithRewards } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { toCoinTypes } from "@sdk/markets/utils";
import { type AccountAddressString } from "@sdk/emojicoin_dot_fun";
import { type Dispatch, type SetStateAction, useEffect, useCallback } from "react";
import {
  Account,
  Ed25519PrivateKey,
  isUserTransactionResponse,
} from "@aptos-labs/ts-sdk";
import { STRUCT_STRINGS } from "@sdk/utils";
import { useAnimationControls } from "framer-motion";
import { RewardsAnimation } from "./RewardsAnimation";
import { toast } from "react-toastify";
import { CongratulationsToast } from "./CongratulationsToast";
import { useCanTradeMarket } from "lib/hooks/queries/use-grace-period";
import Popup from "components/popup";
import { useUserSettings } from "context/event-store-context";
import type { EntryFunctionTransactionBuilder } from "@sdk/emojicoin_dot_fun/payload-builders";

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
  const { aptos, account, submit } = useAptos();
  const controls = useAnimationControls();
  const { canTrade } = useCanTradeMarket(symbol);

  const claimKey = useUserSettings((s) => s.claimKey);
  const setFreeSwapData = useUserSettings((s) => s.setClaimKey);

  const handleClick = useCallback(async () => {
    if (!account) {
      return;
    }
    let builderLambda: () => Promise<EntryFunctionTransactionBuilder>;
    const { emojicoin, emojicoinLP } = toCoinTypes(marketAddress);
    try {
      if (claimKey !== undefined) {
        const privateKey = new Ed25519PrivateKey(Buffer.from(claimKey, "base64").subarray(16));
        const publicKey = privateKey.publicKey();
        const feePayerAccount = Account.fromPrivateKey({ privateKey });
        builderLambda = () =>
          Redeem.builder({
            aptosConfig: aptos.config,
            swapper: account.address,
            signatureBytes: privateKey.sign(account.address).toString(),
            publicKeyBytes: publicKey.toString(),
            marketAddress,
            typeTags: [emojicoin, emojicoinLP],
            minOutputAmount: BigInt(minOutputAmount),
            feePayer: feePayerAccount.accountAddress,
          });
      } else {
        builderLambda = () =>
          SwapWithRewards.builder({
            aptosConfig: aptos.config,
            swapper: account.address,
            marketAddress,
            inputAmount: BigInt(inputAmount),
            isSell,
            typeTags: [emojicoin, emojicoinLP],
            minOutputAmount: BigInt(minOutputAmount),
          });
      }
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
    } catch (e) {
      console.error(e);
    } finally {
      setFreeSwapData(undefined);
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
    claimKey,
    setFreeSwapData,
  ]);

  useEffect(() => {
    setSubmit(() => handleClick);
  }, [handleClick, setSubmit]);

  return (
    <>
      <ButtonWithConnectWalletFallback>
        {canTrade ? (
          <>
            <Button disabled={disabled} onClick={handleClick} scale="lg">
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
