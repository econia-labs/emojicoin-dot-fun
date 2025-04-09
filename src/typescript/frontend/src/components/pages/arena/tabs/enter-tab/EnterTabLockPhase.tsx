import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { useEnterTransactionBuilder } from "lib/hooks/transaction-builders/use-enter-builder";
import { useMemo, useState } from "react";

import Button from "@/components/button";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import { Switcher } from "@/components/switcher";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { getEvents, type MarketStateModel } from "@/sdk/index";

import { useArenaPhaseStore } from "../../phase/store";
import { FormattedNominalNumber } from "../utils";

export default function EnterTabLockPhase({
  market,
  amount,
}: {
  market: MarketStateModel;
  amount: bigint;
}) {
  const { position } = useCurrentPosition();
  const [innerLock, setInnerLock] = useState<boolean>(false);
  const { account, submit } = useAptos();
  const { market0, market1 } = useCurrentMeleeInfo();
  const setPhase = useArenaPhaseStore((s) => s.setPhase);
  const setError = useArenaPhaseStore((s) => s.setError);

  const lockedInToggle = useMemo(
    () => innerLock || position?.lockedIn === true,
    [innerLock, position?.lockedIn]
  );

  const transactionBuilder = useEnterTransactionBuilder(
    amount,
    lockedInToggle,
    market0?.market.marketAddress,
    market1?.market.marketAddress,
    market.market.marketAddress
  );

  return (
    <div className="flex flex-col gap-[2em] pt-14 m-auto items-center w-[100%]">
      <div className="flex justify-between w-[300px]">
        <div className="font-forma text-2xl uppercase text-white text-center">Lock in</div>
        <div className="flex gap-[1em] items-center">
          <div className="uppercase text-light-gray text-xl">
            {lockedInToggle ? "Enabled" : "Disabled"}
          </div>
          <Switcher checked={lockedInToggle} onChange={(v) => setInnerLock(v.target.checked)} />
        </div>
      </div>
      <div className="max-w-[350px] w-[100%]">
        <div className="flex justify-between p-[0.8em] rounded-[3px] bg-ec-blue text-2xl text-black uppercase">
          <div>Deposit amount</div>
          <FormattedNominalNumber value={amount} suffix=" APT" />
        </div>
        <div className="flex uppercase justify-between text-2xl text-light-gray py-[0.8em] mx-[0.8em] border-dashed border-b-[1px] border-light-gray ">
          <div>Match amount</div>
          <FormattedNominalNumber
            value={
              lockedInToggle ? BigInt(Math.floor(Math.min(5 * 10 ** 8, Number(amount / 2n)))) : 0n
            }
            suffix=" APT"
          />
        </div>
        <div className="pt-[2em] grid place-items-center">
          <ButtonWithConnectWalletFallback>
            <Button
              scale="lg"
              onClick={() => {
                if (!account) return;
                submit(transactionBuilder).then((res) => {
                  if (getEvents(res?.response).arenaMeleeEvents.length) {
                    setPhase("pick");
                  } else {
                    setPhase("summary");
                  }
                  if (!res || res?.error) {
                    setError(true);
                  }
                });
              }}
            >
              Enter
            </Button>
          </ButtonWithConnectWalletFallback>
        </div>
      </div>
    </div>
  );
}
