import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { cn } from "lib/utils/class-name";
import { Lock, Share } from "lucide-react";
import { useState } from "react";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import { FormattedNumber } from "@/components/FormattedNumber";
import { PnlModal } from "@/components/pnl-modal/pnl-modal";
import Popup from "@/components/popup";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { useTradingStats } from "@/hooks/use-trading-stats";

import { lockedTernary } from "../../../utils";
import { FormattedNominalNumber } from "../../utils";
import ArenaExitButton from "./ArenaExitButton";
import { AptDisplay, EscrowAptValue } from "./utils";
import SharePopup from "../../profile-tab/melee-breakdown/SharePopup";

const SmallHyphens = () => <span className="text-light-gray text-lg mr-1">--</span>;

export default function Summary({
  position,
  onTapOut,
  setIsTappingOut,
  setIsSwapping,
  topOff,
}: {
  position: CurrentUserPosition;
  onTapOut: () => void;
  setIsTappingOut: (value: boolean) => void;
  setIsSwapping: (value: boolean) => void;
  topOff: () => void;
}) {
  const { market0, market1 } = useCurrentMeleeInfo();
  const { isLoading } = useCurrentPosition();
  const { pnl } = useTradingStats();
  const [isPnlModalOpen, setIsPnlModalOpen] = useState(false);

  return (
    <div className="flex flex-col justify-center grow items-center">
      {isPnlModalOpen && pnl && (
        <PnlModal onClose={() => setIsPnlModalOpen(false)} market={position.currentSymbol} />
      )}

      <div className="flex flex-col justify-center gap-[1em] grow items-center">
        {/* The glowing emoji header */}
        <GlowingEmoji className="text-7xl mt-[2em]" emojis={position.currentSymbol} />

        {/* Line 1 – Current Value display */}
        <div className="flex flex-col gap-[0.3em] items-center">
          <div className="text-light-gray uppercase text-2xl tracking-widest">Position value</div>
          <EscrowAptValue
            position={position}
            market0={market0}
            market1={market1}
            loading={isLoading}
          />
        </div>

        {/* The 3-column grid of Deposited, PNL, and Matched */}
        <div className="grid grid-cols-3 gap-[2em] p-4">
          {/* 1. Deposited */}
          <div className="flex flex-col items-start">
            <div className="flex flex-row text-light-gray uppercase text-2xl tracking-wider">
              <span>Deposits</span>
              {position.lockedIn && (
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
            <AptDisplay amount={position?.deposits} loading={isLoading} className="text-lg" />
          </div>

          {/* 2. PNL */}
          <div className="flex flex-col items-center">
            <div className="text-light-gray uppercase text-2xl tracking-wider">PNL</div>
            {isLoading || pnl === undefined ? (
              <SmallHyphens />
            ) : (
              <div className="flex gap-2 items-center">
                <FormattedNumber
                  className={cn(pnl >= 0 ? "!text-green" : "!text-pink", "font-forma text-lg")}
                  value={pnl}
                  suffix="%"
                />
                <SharePopup setIsPnlModalOpen={setIsPnlModalOpen} />
              </div>
            )}
          </div>

          {/* 3. Matched */}
          <div className="flex flex-col items-end">
            <div className="text-light-gray uppercase text-2xl tracking-wider">Matched</div>
            {position.matchAmount ? (
              <FormattedNominalNumber
                className="font-forma text-white text-lg mr-1"
                value={position.matchAmount}
                prefix="+"
                suffix=" APT"
              />
            ) : (
              <SmallHyphens />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-evenly w-[100%]">
        <Button scale="lg" onClick={topOff}>
          Top off
        </Button>
        <Button scale="lg" onClick={() => setIsSwapping(true)}>
          Swap
        </Button>
        <ArenaExitButton
          text={lockedTernary(position, "Tap out", "Exit")}
          onClick={lockedTernary(position, () => setIsTappingOut(true), onTapOut)}
          summaryPage
        />
      </div>
    </div>
  );
}
