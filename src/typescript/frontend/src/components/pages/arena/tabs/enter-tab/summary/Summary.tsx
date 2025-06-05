import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import { useCurrentPosition } from "lib/hooks/positions/use-current-position";
import { cn } from "lib/utils/class-name";
import { Lock } from "lucide-react";
import { GlowingEmoji } from "utils/emoji";

import Button from "@/components/button";
import { FormattedNumber } from "@/components/FormattedNumber";
import Popup from "@/components/popup";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import { useTradingStats } from "@/hooks/use-trading-stats";

import { lockedTernary } from "../../../utils";
import { FormattedNominalNumber } from "../../utils";
import ArenaExitButton from "./ArenaExitButton";
import { AptDisplay, EscrowAptValue } from "./utils";

const SmallHyphens = () => <span className="mr-1 text-lg text-light-gray">--</span>;

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

  return (
    <div className="flex grow flex-col items-center justify-center">
      <div className="flex grow flex-col items-center justify-center gap-[1em]">
        {/* The glowing emoji header */}
        <GlowingEmoji className="mt-[2em] text-7xl" emojis={position.currentSymbol} />

        {/* Line 1 – Current Value display */}
        <div className="flex flex-col items-center gap-[0.3em]">
          <div className="text-2xl uppercase tracking-widest text-light-gray">Position value</div>
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
            <div className="flex flex-row text-2xl uppercase tracking-wider text-light-gray">
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
            <div className="text-2xl uppercase tracking-wider text-light-gray">PNL</div>
            {isLoading || pnl === undefined ? (
              <SmallHyphens />
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
            <div className="text-2xl uppercase tracking-wider text-light-gray">Matched</div>
            {position.matchAmount ? (
              <FormattedNominalNumber
                className="mr-1 font-forma text-lg text-white"
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
      <div className="flex w-[100%] justify-evenly">
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
