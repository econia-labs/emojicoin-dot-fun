import type { UserTransactionResponse } from "@aptos-labs/ts-sdk";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useArenaSwapTransactionBuilder } from "lib/hooks/transaction-builders/use-arena-swap-builder";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { useCallback, useState } from "react";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import { FormattedNumber } from "@/components/FormattedNumber";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import type { ArenaPositionModel, MarketStateModel } from "@/sdk/index";
import { ARENA_MODULE_ADDRESS, q64ToBig } from "@/sdk/index";

import { lockedTernary, marketTernary } from "../../utils";
import { BlurModal } from "./BlurModal";

export const EnterTabSummary: React.FC<{
  market0: MarketStateModel;
  market1: MarketStateModel;
  market: MarketStateModel;
  position: ArenaPositionModel;
  setPosition: (position: ArenaPositionModel | null) => void;
  topOff: () => void;
  tapOut: () => void;
  swap: () => void;
}> = ({ market, market0, market1, position, setPosition, topOff, tapOut, swap }) => {
  const [isTappingOut, setIsTappingOut] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const formatter = new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 2,
  });
  const matchNumberText = formatter.format(Number(position.matchAmount) / 10 ** 8);
  const tapOutButtonText = `Accept and exit, incurring a ${matchNumberText} APT tap out fee`;
  const { account, submit } = useAptos();
  const exitTransactionBuilder = useExitTransactionBuilder(
    market0.market.marketAddress,
    market1.market.marketAddress
  );
  const swapTransactionBuilder = useArenaSwapTransactionBuilder(
    market0.market.marketAddress,
    market1.market.marketAddress
  );
  const amount = marketTernary(
    position,
    BigInt(
      q64ToBig(market0.lastSwap.avgExecutionPriceQ64)
        .mul(position.emojicoin0Balance.toString())
        .round()
        .toString()
    ),
    BigInt(
      q64ToBig(market1.lastSwap.avgExecutionPriceQ64)
        .mul(position.emojicoin1Balance.toString())
        .round()
        .toString()
    )
  );

  const onTapOut = useCallback(() => {
    if (!account) return;
    submit(exitTransactionBuilder).then((r) => {
      if (!r || r?.error) {
        console.error("Could not exit", { error: r?.error });
      } else {
        tapOut();
        setPosition(null);
      }
    });
  }, [account, exitTransactionBuilder, tapOut, setPosition, submit]);

  return (
    <div className="relative h-[100%]">
      {isTappingOut && (
        <BlurModal close={() => setIsTappingOut(false)}>
          <div className="flex flex-col gap-[3em] max-w-[58ch]">
            <div className="text-4xl uppercase text-white text-center">
              Are you sure you want to tap out?
            </div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              You have been matched a total of {matchNumberText} APT since your first deposit to an
              empty escrow. To exit before the melee is over, you must pay back the{" "}
              {matchNumberText} APT in order to tap out.
            </div>
            <div className="font-forma text-light-gray leading-6 uppercase">
              If you don&apos;t want to pay the tap out penalty, wait to exit until the melee has
              ended and then you&apos;ll be able to keep all matched deposits.
            </div>
          </div>
          <ButtonWithConnectWalletFallback>
            <Button scale="lg" onClick={onTapOut}>
              {tapOutButtonText}
            </Button>
          </ButtonWithConnectWalletFallback>
        </BlurModal>
      )}
      {isSwapping && (
        <BlurModal close={() => setIsSwapping(false)}>
          <div className="flex flex-col justify-between items-center h-[100%] py-[3em]">
            <GlowingEmoji
              className="text-6xl mt-[1em]"
              emojis={marketTernary(
                position,
                market1.market.symbolEmojis.join(""),
                market0.market.symbolEmojis.join("")
              )}
            />
            <div className="flex flex-col justify-between items-center gap-[.5em]">
              <div className="text-light-gray uppercase text-2xl tracking-widest">
                Swapping holding
              </div>
              <FormattedNumber
                className="font-forma text-6xl text-white"
                value={amount}
                nominalize
                suffix=" APT"
              />
            </div>
            <ButtonWithConnectWalletFallback>
              <Button
                scale="lg"
                onClick={() => {
                  if (!account) return;
                  submit(swapTransactionBuilder).then((r) => {
                    if (!r || r?.error) {
                      console.error("Could not swap", { error: r?.error });
                    } else {
                      const swapEvent = (r.response as UserTransactionResponse).events.find(
                        (e) => e.type === `${ARENA_MODULE_ADDRESS}::emojicoin_arena::Swap`
                      )!;
                      swap();
                      setPosition({
                        ...position,
                        emojicoin0Balance: BigInt(swapEvent.data.emojicoin_0_proceeds),
                        emojicoin1Balance: BigInt(swapEvent.data.emojicoin_1_proceeds),
                      });
                      setIsSwapping(false);
                    }
                  });
                }}
              >
                Swap
              </Button>
            </ButtonWithConnectWalletFallback>
          </div>
        </BlurModal>
      )}
      <div className="flex flex-col justify-between items-center h-[100%] pt-[3em]">
        <GlowingEmoji className="text-6xl mt-[1em]" emojis={market.market.symbolEmojis.join("")} />
        <div className="flex flex-col justify-between items-center gap-[.5em]">
          <div className="text-light-gray uppercase text-2xl tracking-widest">
            {lockedTernary(position, "Locked in", "Deposited")}
          </div>
          <FormattedNumber
            className="font-forma text-6xl text-white"
            value={amount}
            nominalize
            suffix=" APT"
          />
          <div className="flex flex-col items-center gap-[.4em]">
            <div className="text-light-gray uppercase text-xl tracking-wider">Matched</div>
            <FormattedNumber
              className="font-forma text-white text-md"
              value={position.matchAmount}
              nominalize
              prefix="+"
              suffix=" APT"
            />
          </div>
        </div>
        <div className="flex justify-evenly w-[100%] pb-[2em]">
          <Button scale="lg" onClick={topOff}>
            Top off
          </Button>
          <Button scale="lg" onClick={() => setIsSwapping(true)}>
            Swap
          </Button>
          <Button
            scale="lg"
            onClick={() => {
              lockedTernary(position, () => setIsTappingOut(true), onTapOut)();
            }}
          >
            {lockedTernary(position, "Tap out", "Exit")}
          </Button>
        </div>
      </div>
    </div>
  );
};
