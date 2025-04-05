import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { isUserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useEnterTransactionBuilder } from "lib/hooks/transaction-builders/use-enter-builder";
import { useState } from "react";

import Button from "@/components/button";
import { FormattedNumber } from "@/components/FormattedNumber";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import { Switcher } from "@/components/switcher";
import type { ArenaPositionModel, MarketStateModel } from "@/sdk/index";
import { ARENA_MODULE_ADDRESS } from "@/sdk/index";

export const EnterTabLockPhase: React.FC<{
  market: MarketStateModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
  amount: bigint;
  errorOut: () => void;
  setCranked: () => void;
  position?: ArenaPositionModel | null;
  setPosition: (position: ArenaPositionModel | null) => void;
}> = ({ market, market0, market1, amount, errorOut, setCranked, position, setPosition }) => {
  const [innerLock, setInnerLock] = useState<boolean>(false);

  const { account, submit } = useAptos();

  const transactionBuilder = useEnterTransactionBuilder(
    amount,
    innerLock,
    market0.market.marketAddress,
    market1.market.marketAddress,
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
          <FormattedNumber value={amount} nominalize suffix=" APT" />
        </div>
        <div className="flex uppercase justify-between text-2xl text-light-gray py-[0.8em] mx-[0.8em] border-dashed border-b-[1px] border-light-gray ">
          <div>Match amount</div>
          <FormattedNumber
            value={innerLock ? BigInt(Math.floor(Math.min(5 * 10 ** 8, Number(amount / 2n)))) : 0n}
            nominalize
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
                  } else if (
                    (res.response as UserTransactionResponse).events.find(
                      (e) => e.type === `${ARENA_MODULE_ADDRESS}::emojicoin_arena::Melee`
                    )
                  ) {
                    setCranked();
                  } else {
                    const { response } = res;
                    if (!response || !isUserTransactionResponse(response)) return;
                    const version = BigInt(response.version);
                    const enterEvent = response.events.find(
                      (e) => e.type === `${ARENA_MODULE_ADDRESS}::emojicoin_arena::Enter`
                    )!;
                    if (!enterEvent) return;
                    if (position && position.open) {
                      setPosition({
                        ...position,
                        version,
                        deposits: position.deposits + BigInt(enterEvent.data.input_amount),
                        matchAmount: position.matchAmount + BigInt(enterEvent.data.match_amount),
                        emojicoin0Balance:
                          position.emojicoin0Balance + BigInt(enterEvent.data.emojicoin_0_proceeds),
                        emojicoin1Balance:
                          position.emojicoin1Balance + BigInt(enterEvent.data.emojicoin_1_proceeds),
                      });
                    } else {
                      setPosition({
                        open: true,
                        version,
                        user: account.address as `0x${string}`,
                        meleeID: BigInt(enterEvent.data.melee_id),
                        deposits: BigInt(enterEvent.data.input_amount),
                        lastExit0: null,
                        matchAmount: BigInt(enterEvent.data.match_amount),
                        withdrawals: 0n,
                        emojicoin0Balance: BigInt(enterEvent.data.emojicoin_0_proceeds),
                        emojicoin1Balance: BigInt(enterEvent.data.emojicoin_1_proceeds),
                      });
                    }
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
