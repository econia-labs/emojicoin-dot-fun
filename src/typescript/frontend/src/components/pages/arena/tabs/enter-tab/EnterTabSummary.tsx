import { useAptos } from "context/wallet-context/AptosContextProvider";
import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { useArenaSwapTransactionBuilder } from "lib/hooks/transaction-builders/use-arena-swap-builder";
import { useExitTransactionBuilder } from "lib/hooks/transaction-builders/use-exit-builder";
import { useCallback, useMemo, useState } from "react";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import ButtonWithConnectWalletFallback from "@/components/header/wallet-button/ConnectWalletButton";
import AnimatedLoadingBoxes from "@/components/pages/launch-emojicoin/animated-loading-boxes";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { MarketStateModel, UserEscrow } from "@/sdk/index";
import { q64ToBig } from "@/sdk/index";

import { ifEscrowTernary, ifLockedTernary } from "../../utils";
import { FormattedAndNominalized } from "../utils";
import { BlurModal } from "./BlurModal";

export const EnterTabSummary: React.FC<{
  // Use the escrow value for things like which side the user is on and their current escrowed balance.
  escrow: UserEscrow;
  market: MarketStateModel;
  topOff: () => void;
  tapOut: () => void;
  swap: () => void;
}> = ({ escrow, market, topOff, tapOut, swap }) => {
  // Use the current position info for indexed data that can't be derived from on-chain data.
  const { position, isLoading, isFetching } = useCurrentPositionQuery();
  const [isTappingOut, setIsTappingOut] = useState<boolean>(false);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const { account, submit } = useAptos();
  const { market0, market1 } = useCurrentMeleeInfo();
  const exitTransactionBuilder = useExitTransactionBuilder(
    market0?.market.marketAddress,
    market1?.market.marketAddress
  );
  const swapTransactionBuilder = useArenaSwapTransactionBuilder(
    market0?.market.marketAddress,
    market1?.market.marketAddress
  );
  const formatter = new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: 2,
  });
  const matchNumberText = position
    ? formatter.format(Number(position.matchAmount) / 10 ** 8)
    : undefined;

  const onTapOut = useCallback(() => {
    if (!account) return;
    submit(exitTransactionBuilder).then((r) => {
      if (!r || r?.error) {
        console.error("Could not exit", { error: r?.error });
      } else {
        tapOut();
      }
    });
  }, [account, exitTransactionBuilder, tapOut, submit]);

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
              <div className="flex flex-row gap-1">
                <span>{"Accept and exit, incurring a "}</span>
                {!position || matchNumberText === undefined || isLoading || isFetching ? (
                  <AnimatedLoadingBoxes numSquares={2} />
                ) : (
                  <span>{"APT tap out fee"}</span>
                )}
              </div>
            </Button>
          </ButtonWithConnectWalletFallback>
        </BlurModal>
      )}
      {isSwapping && (
        <BlurModal close={() => setIsSwapping(false)}>
          <div className="flex flex-col justify-between items-center h-[100%] py-[3em]">
            {market0 && market1 ? (
              <GlowingEmoji
                className="text-6xl mt-[1em]"
                emojis={ifEscrowTernary(
                  escrow,
                  market1.market.symbolEmojis.join(""),
                  market0.market.symbolEmojis.join("")
                )}
              />
            ) : (
              <AnimatedLoadingBoxes numSquares={4} />
            )}
            <div className="flex flex-col justify-between items-center gap-[.5em]">
              <div className="text-light-gray uppercase text-2xl tracking-widest">
                Swapping holding
              </div>
              <MaybeAptAmount escrow={escrow} market0={market0} market1={market1} />
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
                      swap();
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
            {ifLockedTernary(escrow, "Locked in", "Deposited")}
          </div>
          <MaybeAptAmount escrow={escrow} market0={market0} market1={market1} />
          <div className="flex flex-col items-center gap-[.4em]">
            <div className="text-light-gray uppercase text-xl tracking-wider">Matched</div>
            <FormattedAndNominalized
              className="font-forma text-white text-md"
              value={escrow.matchAmount}
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
              ifLockedTernary(escrow, () => setIsTappingOut(true), onTapOut)();
            }}
          >
            {ifLockedTernary(escrow, "Tap out", "Exit")}
          </Button>
        </div>
      </div>
    </div>
  );
};

function MaybeAptAmount({
  escrow,
  market0,
  market1,
}: {
  escrow: UserEscrow;
  market0?: MarketStateModel;
  market1?: MarketStateModel;
}) {
  const amount = useMemo(() => {
    if (market0 === undefined || market1 === undefined) return undefined;
    return ifEscrowTernary(
      escrow,
      BigInt(
        q64ToBig(market0.lastSwap.avgExecutionPriceQ64)
          .mul(escrow.emojicoin0.toString())
          .round()
          .toString()
      ),
      BigInt(
        q64ToBig(market1.lastSwap.avgExecutionPriceQ64)
          .mul(escrow.emojicoin1.toString())
          .round()
          .toString()
      )
    );
  }, [escrow, market0, market1]);

  return amount !== undefined ? (
    <FormattedAndNominalized
      className="font-forma text-6xl text-white"
      value={amount}
      suffix=" APT"
    />
  ) : (
    <AnimatedLoadingBoxes numSquares={2} />
  );
}
