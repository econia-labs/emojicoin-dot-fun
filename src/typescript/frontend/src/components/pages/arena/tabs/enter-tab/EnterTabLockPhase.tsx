import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEnterTransactionBuilder } from "lib/hooks/transaction-builders/use-enter-builder";
import { useState } from "react";

import Button from "@/components/button";
import { FormattedNumber } from "@/components/FormattedNumber";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import { Switcher } from "@/components/switcher";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { MarketStateModel } from "@/sdk/index";

import { FormattedAndNominalized } from "../utils";

export const EnterTabLockPhase: React.FC<{
  market: MarketStateModel;
  amount: bigint;
  errorOut: () => void;
}> = ({ market, amount, errorOut }) => {
  const [innerLock, setInnerLock] = useState<boolean>(false);
  const { account, submit } = useAptos();
  const { market0, market1 } = useCurrentMeleeInfo();
  const transactionBuilder = useEnterTransactionBuilder(
    amount,
    innerLock,
    market0?.market.marketAddress,
    market1?.market.marketAddress,
    market.market.marketAddress
  );

  return (
    <div className="flex flex-col gap-[2em] m-auto items-center w-[100%]">
      <div className="flex justify-between w-[300px]">
        <div className="font-forma text-2xl uppercase text-white text-center">Lock in</div>
        <div className="flex gap-[1em] items-center">
          <div className="uppercase text-light-gray text-xl">
            {innerLock ? "Enabled" : "Disabled"}
          </div>
          <Switcher checked={innerLock} onChange={(v) => setInnerLock(v.target.checked)} />
        </div>
      </div>
      <div className="max-w-[350px] w-[100%]">
        <div className="flex justify-between p-[0.8em] rounded-[3px] bg-ec-blue text-2xl text-black uppercase">
          <div>Deposit amount</div>
          <FormattedAndNominalized value={amount} suffix=" APT" />
        </div>
        <div className="flex uppercase justify-between text-2xl text-light-gray py-[0.8em] mx-[0.8em] border-dashed border-b-[1px] border-light-gray ">
          <div>Match amount</div>
          <FormattedAndNominalized
            value={innerLock ? BigInt(Math.floor(Math.min(5 * 10 ** 8, Number(amount / 2n)))) : 0n}
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
                  if (!res || res?.error) {
                    errorOut();
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
};
