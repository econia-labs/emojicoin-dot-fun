import { useMatchBreakpoints } from "@hooks/index";
import {
  type ArenaLeaderboardHistoryWithArenaInfoModel,
  type ArenaPositionsModel,
  type ArenaInfoModel,
  type MarketStateModel,
  type PeriodicStateEventModel,
} from "@sdk/indexer-v2/types";
import { type CSSProperties, useState } from "react";
import darkTheme from "theme/dark";
import { GlowingEmoji } from "utils/emoji";

export type Props = {
  arenaInfo: ArenaInfoModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
  candlesticksMarket0: PeriodicStateEventModel[];
  candlesticksMarket1: PeriodicStateEventModel[];
};

export type PropsWithPositionAndHistory = Props & {
  position?: ArenaPositionsModel | null;
  setPosition: (position: ArenaPositionsModel | null) => void;
  history: ArenaLeaderboardHistoryWithArenaInfoModel[];
  setHistory: (position: ArenaLeaderboardHistoryWithArenaInfoModel[]) => void;
};

export const Box: React.FC<
  React.PropsWithChildren<{ className?: string; style?: CSSProperties }>
> = ({ children, className, style }) => {
  return (
    <div
      className={`border-solid border-[1px] border-dark-gray rounded-[3px] bg-black/75 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export const getFontMultiplier = (emojis: number) => {
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

  const [hover0, setHover0] = useState<boolean>(false);
  const [hover1, setHover1] = useState<boolean>(false);

  const baseCircleStyle =
    "absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] rounded-full z-[-1]";

  return (
    <div
      className="grid place-items-center uppercase w-[100%]"
      style={{
        fontSize: baseFontSize + "px",
        gridTemplateColumns: "1fr auto 1fr",
      }}
    >
      <span
        className={`relative z-[2] ${onClicks !== undefined ? "cursor-pointer" : ""}`}
        onClick={onClicks?.emoji0}
        onMouseEnter={() => setHover0(true)}
        onMouseLeave={() => setHover0(false)}
      >
        <GlowingEmoji emojis={market0Symbols.join("")} />{" "}
        {onClicks !== undefined && hover0 ? (
          <>
            <div
              style={{
                boxShadow: `0 0 16px 4px ${darkTheme.colors.econiaBlue}50`,
              }}
              className={`${baseCircleStyle} h-[1.5em] w-[1.5em] bg-ec-blue/75`}
            ></div>
            <div
              style={{
                boxShadow: `0 0 16px 8px ${darkTheme.colors.econiaBlue}50`,
              }}
              className={`${baseCircleStyle} h-[2.5em] w-[2.5em] bg-ec-blue/50`}
            ></div>
            <div className={`${baseCircleStyle} h-[3.5em] w-[3.5em] bg-ec-blue/25`}></div>
          </>
        ) : (
          <></>
        )}
      </span>
      <span style={{ fontSize: baseFontSize * 1.2 + "px" }} className="text-light-gray">
        vs
      </span>{" "}
      <span
        className={`relative z-[2] ${onClicks !== undefined ? "cursor-pointer" : ""}`}
        onClick={onClicks?.emoji1}
        onMouseEnter={() => setHover1(true)}
        onMouseLeave={() => setHover1(false)}
      >
        <GlowingEmoji emojis={market1Symbols.join("")} />
        {onClicks !== undefined && hover1 ? (
          <>
            <div
              style={{
                boxShadow: `0 0 16px 4px ${darkTheme.colors.pink}50`,
              }}
              className={`${baseCircleStyle} h-[1.5em] w-[1.5em] bg-pink/75`}
            ></div>
            <div
              style={{
                boxShadow: `0 0 16px 8px ${darkTheme.colors.pink}50`,
              }}
              className={`${baseCircleStyle} h-[2.5em] w-[2.5em] bg-pink/50`}
            ></div>
            <div className={`${baseCircleStyle} h-[3.5em] w-[3.5em] bg-pink/25`}></div>
          </>
        ) : (
          <></>
        )}
      </span>
    </div>
  );
};

/** If the position is on market0, return option0, else return option1 */
export function marketTernary<T>(position: ArenaPositionsModel, option0: T, option1: T) {
  return position.emojicoin0Balance > 0n ? option0 : option1;
}

/** If the position is locked, return option0, else return option1 */
export function lockedTernary<T>(position: ArenaPositionsModel, option0: T, option1: T) {
  return position.matchAmount > 0n ? option0 : option1;
}
