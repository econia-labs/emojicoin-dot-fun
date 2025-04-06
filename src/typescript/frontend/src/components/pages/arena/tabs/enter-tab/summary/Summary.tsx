import { useCurrentPositionQuery } from "lib/hooks/queries/arena/use-current-position";
import { cn } from "lib/utils/class-name";
import { Lock } from "lucide-react";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import { FormattedNumber } from "@/components/FormattedNumber";
import AnimatedLoadingBoxes from "@/components/pages/launch-emojicoin/animated-loading-boxes";
import Popup from "@/components/popup";
import { useArenaProfileStats } from "@/hooks/use-arena-profile-stats";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { UserEscrow } from "@/sdk/index";

import { ifLockedTernary } from "../../../utils";
import { FormattedNominalNumber } from "../../utils";
import { AptDisplay, EscrowAptValue } from "./utils";

export default function Summary({
  escrow,
  loading,
  onTapOut,
  setIsTappingOut,
  setIsSwapping,
  topOff,
}: {
  escrow: UserEscrow & { currentSymbol: string };
  loading: boolean;
  onTapOut: () => void;
  setIsTappingOut: (value: boolean) => void;
  setIsSwapping: (value: boolean) => void;
  topOff: () => void;
}) {
  const { market0, market1 } = useCurrentMeleeInfo();
  const { position } = useCurrentPositionQuery();
  const { pnl } = useArenaProfileStats();

  return (
    <div className="flex flex-col justify-between items-center h-[100%] pt-[3.5em]">
      {/* The glowing emoji header */}
      <GlowingEmoji className="text-7xl mt-[2em]" emojis={escrow.currentSymbol} />
      <div className="flex flex-col justify-between gap-[1em] items-center">
        {/* Line 1 – Current Value display */}
        <div className="flex flex-col gap-[0.3em] items-center">
          <div className="text-light-gray uppercase text-2xl tracking-widest">Position value</div>
          <EscrowAptValue escrow={escrow} market0={market0} market1={market1} loading={loading} />
        </div>

        {/* The 3-column grid of Deposited, PNL, and Matched */}
        <div className="grid grid-cols-3 gap-[2em] p-4">
          {/* 1. Deposited */}
          <div className="flex flex-col items-start">
            <div className="flex flex-row text-light-gray uppercase text-2xl tracking-wider">
              <span>Deposits</span>
              {escrow.lockedIn && (
                <Popup
                  content={
                    <span>
                      Your deposits are locked in because
                      <br />
                      your position was partially matched
                    </span>
                  }
                >
                  <Lock className="m-auto ml-[3px] text-ec-blue" size={16} />
                </Popup>
              )}
            </div>
            <AptDisplay amount={position?.deposits} loading={loading} className="text-lg" />
          </div>

          {/* 2. PNL */}
          <div className="flex flex-col items-center">
            <div className="text-light-gray uppercase text-2xl tracking-wider">PNL</div>
            {loading || pnl === undefined ? (
              <AnimatedLoadingBoxes numSquares={4} />
            ) : (
              <FormattedNumber
                className={cn(pnl >= 0 ? "!text-green" : "!text-pink", "font-forma text-lg")}
                value={pnl}
                suffix="%"
              />
            )}
          </div>

          {/* 3. Matched */}
          <div className="flex flex-col items-end">
            <div className="text-light-gray uppercase text-2xl tracking-wider">Matched</div>
            {escrow.matchAmount ? (
              <FormattedNominalNumber
                className="font-forma text-white text-lg mr-1"
                value={escrow.matchAmount}
                prefix="+"
                suffix=" APT"
              />
            ) : (
              <span className="text-light-gray text-lg mr-1">--</span>
            )}
          </div>
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
  );
}
