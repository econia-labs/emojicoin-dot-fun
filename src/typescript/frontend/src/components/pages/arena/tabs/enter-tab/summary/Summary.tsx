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
import { AptDisplay, EscrowAptValue } from "./utils";

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

  return (
    <div className="flex flex-col justify-center items-center h-[100%] py-2">
      {/* The glowing emoji header */}
      <GlowingEmoji className="text-7xl mt-[2em]" emojis={position.currentSymbol} />
      <div className="flex flex-col justify-between gap-[1em] items-center">
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
  );
}
