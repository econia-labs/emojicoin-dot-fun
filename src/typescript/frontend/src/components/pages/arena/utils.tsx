import type { ClassValue } from "clsx";
import React from "react";
import { GlowingEmoji } from "utils/emoji";

import { useMatchBreakpoints } from "@/hooks/index";
import type {
  ArenaInfoModel,
  ArenaLeaderboardHistoryWithArenaInfoModel,
  ArenaPositionModel,
  MarketStateModel,
} from "@/sdk/indexer-v2/types";

export type ArenaProps = {
  arenaInfo: ArenaInfoModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
};

export type ArenaPropsWithPositionHistoryAndEmojiData = ArenaProps & {
  position?: ArenaPositionModel | null;
  setPosition: (position: ArenaPositionModel | null) => void;
  history: ArenaLeaderboardHistoryWithArenaInfoModel[];
  setHistory: (position: ArenaLeaderboardHistoryWithArenaInfoModel[]) => void;
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
  market0Symbols,
  market1Symbols,
  onClicks,
}: {
  market0Symbols: string[];
  market1Symbols: string[];
  onClicks?: {
    emoji0: () => void;
    emoji1: () => void;
  };
}) => {
  const { isMobile, isTablet, isLaptop } = useMatchBreakpoints();
  const emojiCount = market0Symbols.length + market1Symbols.length;
  // Formula to get a good font size for the amount of emojis to display.
  // Works great for up to 6 emojis (not tested for more, but might work as well).
  const baseFontSize =
    72 *
    (isMobile ? 0.75 : 1) *
    (isTablet ? 0.6 : 1) *
    (isLaptop ? 0.69 : 1) *
    getFontMultiplier(emojiCount);

  return (
    <div
      className="grid place-items-center uppercase w-[100%]"
      style={{
        fontSize: baseFontSize + "px",
        gridTemplateColumns: "1fr auto 1fr",
      }}
    >
      <GlowingEmoji onClick={onClicks?.emoji0} emojis={market0Symbols.join("")} />
      <span style={{ fontSize: baseFontSize * 1.2 + "px" }} className="text-light-gray">
        vs
      </span>{" "}
      <GlowingEmoji onClick={onClicks?.emoji1} emojis={market1Symbols.join("")} />
    </div>
  );
};

/** If the position is on market0, return option0, else return option1 */
export function marketTernary<T>(position: ArenaPositionModel, option0: T, option1: T) {
  return position.emojicoin0Balance > 0n ? option0 : option1;
}

/** If the position is locked, return option0, else return option1 */
export function lockedTernary<T>(position: ArenaPositionModel, option0: T, option1: T) {
  return position.matchAmount > 0n ? option0 : option1;
}
