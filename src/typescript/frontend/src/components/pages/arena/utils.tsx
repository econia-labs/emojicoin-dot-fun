import type { ClassValue } from "clsx";
import type { CurrentUserPosition } from "lib/hooks/positions/use-current-position";
import { cn } from "lib/utils/class-name";
import React, { useMemo } from "react";
import { GlowingEmoji } from "utils/emoji";

import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";
import type { HistoricalEscrow } from "@/sdk/index";
import type { ArenaInfoModel, MarketStateModel } from "@/sdk/indexer-v2/types";

export type ArenaProps = {
  arenaInfo: ArenaInfoModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
};

export type ArenaPropsWithVaultBalance = ArenaProps & { vaultBalance: bigint };

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
  return 1 - (emojis * 6) / 60;
};

export const EmojiTitle = ({
  onClicks,
  fontSizeMultiplier = 1,
}: {
  onClicks?: {
    emoji0: () => void;
    emoji1: () => void;
  };
  fontSizeMultiplier?: number;
}) => {
  const { market0, market1 } = useCurrentMeleeInfo();

  const { emojis0, emojis1, fontSize } = useMemo(() => {
    const emojis0 = market0?.market.symbolEmojis ?? [];
    const emojis1 = market1?.market.symbolEmojis ?? [];

    const fontSize =
      4 * getFontMultiplier(Math.max(emojis0.length, emojis1.length)) * fontSizeMultiplier;
    return {
      emojis0,
      emojis1,
      fontSize,
    };
  }, [fontSizeMultiplier, market0?.market.symbolEmojis, market1?.market.symbolEmojis]);

  return (
    <div
      className={cn("grid place-items-center uppercase w-[100%] h-full")}
      style={{
        gridTemplateColumns: "1fr auto 1fr",
        fontSize: fontSize + "vw",
      }}
    >
      <GlowingEmoji
        className="md:text-inherit"
        onClick={onClicks?.emoji0}
        emojis={emojis0.join("")}
      />
      <span className="text-light-gray text-[4vw]">vs</span>{" "}
      <GlowingEmoji onClick={onClicks?.emoji1} emojis={emojis1.join("")} />
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
