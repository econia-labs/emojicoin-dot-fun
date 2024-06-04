import ButtonWithConnectWalletFallback from "components/header/wallet-button/ConnectWalletButton";
import Button from "components/button";
import { translationFunction } from "context/language-context";
import { Swap } from "@sdk/emojicoin_dot_fun/emojicoin-dot-fun";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { INTEGRATOR_ADDRESS, INTEGRATOR_FEE_RATE_BPS } from "lib/env";
import { toCoinTypes } from "@sdk/markets/utils";
import { useEventStore } from "context/store-context";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { getEvents } from "@sdk/emojicoin_dot_fun";

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
  const { addSwapEvent, addStateEvent, addPeriodicStateEvent } = useEventStore((state) => state);

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
    await submit(builderLambda).then((res) => {
      if (res?.response && isUserTransactionResponse(res.response)) {
        const events = getEvents(res.response);
        events.stateEvents.forEach((state) => {
          console.debug("adding state to event store:", state);
          addStateEvent(state);
        });
        events.periodicStateEvents.forEach((periodicState) => {
          console.debug("adding periodic state to event store:", periodicState);
          addPeriodicStateEvent(periodicState);
        });
        events.swapEvents.forEach((swap) => {
          console.debug("adding swap to event store:", swap);
          addSwapEvent(swap);
        });
      }
      return null;
    });
  };

  return (
    <ButtonWithConnectWalletFallback>
      <Button onClick={handleClick} scale="lg">
        {t("Swap")}
      </Button>
    </ButtonWithConnectWalletFallback>
  );
};
