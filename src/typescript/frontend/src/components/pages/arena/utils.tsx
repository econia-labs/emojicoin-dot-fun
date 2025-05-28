import type { ClassValue } from "clsx";
import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import React, { useMemo } from "react";
import { GlowingEmoji } from "utils/emoji";

import { useMatchBreakpoints } from "@/hooks/index";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { HistoricalEscrow } from "@/sdk/index";
import type { ArenaInfoModel, MarketStateModel } from "@/sdk/indexer-v2/types";

import ArenaMarketsPriceDeltaPopover from "./ArenaMarketsPriceDeltaPopover";

export type ArenaProps = {
  arenaInfo: ArenaInfoModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
  market0Delta: number | null;
  market1Delta: number | null;
};

export type ArenaPropsWithVaultBalance = ArenaProps & {
  vaultBalance: bigint;
};

export const Box = ({
  className,
  children,
}: {
  className?: ClassValue;
} & React.PropsWithChildren) => (
  <div
    className={`border-solid border-[1px] border-dark-gray rounded-[3px] bg-black/75 ${className}`}
  >
    {children}
  </div>
);

const getFontMultiplier = (emojis: number) => {
  return 1 - (emojis * 5) / 6 / 10;
};

export const EmojiTitle = ({
  onClicks,
  market0Delta = null,
  market1Delta = null,
}: {
  onClicks?: {
    emoji0: () => void;
    emoji1: () => void;
  };
  market0Delta?: number | null;
  market1Delta?: number | null;
}) => {
  const { isMobile, isTablet, isLaptop } = useMatchBreakpoints();
  const { market0, market1 } = useCurrentMeleeInfo();

  const { emojis0, emojis1, baseFontSize } = useMemo(() => {
    const emojis0 = market0?.market.symbolEmojis ?? [];
    const emojis1 = market1?.market.symbolEmojis ?? [];
    return {
      emojis0,
      emojis1,
      // Formula to get a good font size for the amount of emojis to display.
      // Works great for up to 6 emojis (not tested for more, but might work as well).
      baseFontSize:
        72 *
        (isMobile ? 0.75 : 1) *
        (isTablet ? 0.6 : 1) *
        (isLaptop ? 0.69 : 1) *
        getFontMultiplier(emojis0.length + emojis1.length),
    };
  }, [market0, market1, isLaptop, isMobile, isTablet]);

  return (
    <div
      className="grid place-items-center uppercase w-[100%]"
      style={{
        fontSize: baseFontSize + "px",
        gridTemplateColumns: "1fr auto 1fr",
      }}
    >
      <div className="flex flex-col gap-2">
        <div className="m-auto">
          <GlowingEmoji onClick={onClicks?.emoji0} emojis={emojis0.join("")} />
        </div>
        <ArenaMarketsPriceDeltaPopover delta={market0Delta} />
      </div>
      <span style={{ fontSize: baseFontSize * 1.2 + "px" }} className="text-light-gray">
        vs
      </span>{" "}
      <div className="flex flex-col gap-2">
        <div className="m-auto">
          <GlowingEmoji onClick={onClicks?.emoji1} emojis={emojis1.join("")} />
        </div>
        <ArenaMarketsPriceDeltaPopover delta={market1Delta} />
      </div>
    </div>
  );
};

/** If the escrow/position is on market0, return option0, else return option1 */
export function marketTernary<T>(
  escrow: CurrentUserPosition | HistoricalEscrow,
  option0: T,
  option1: T
) {
  return ("emojicoin0" in escrow ? escrow.emojicoin0 : escrow.emojicoin0Balance) > 0n
    ? option0
    : option1;
}

/** If the position is locked, return option0, else return option1 */
export function lockedTernary<T>(position: CurrentUserPosition, option0: T, option1: T) {
  return position.lockedIn ? option0 : option1;
}
