"use client";

import { useMatchBreakpoints } from "@hooks/index";
import type { ArenaInfoModel, MarketStateModel } from "@sdk/indexer-v2/types";
import { Countdown } from "components/Countdown";
import { FormattedNumber } from "components/FormattedNumber";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

type Props = {
  arenaInfo: ArenaInfoModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
};

const Box: React.FC<React.PropsWithChildren<{ className?: string; style?: CSSProperties }>> = ({
  children,
  className,
  style,
}) => {
  return (
    <div
      className={`border-solid border-[1px] border-dark-gray rounded-[3px] bg-black/50 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

const EmojiTitle = ({
  market0Symbols,
  market1Symbols,
}: {
  market0Symbols: string[];
  market1Symbols: string[];
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
    (1 - (emojiCount * 5) / 6 / 10);
  return (
    <div className="text-center uppercase" style={{ fontSize: baseFontSize + "px" }}>
      <Emoji emojis={market0Symbols.join("")} />{" "}
      <span style={{ fontSize: baseFontSize * 1.2 + "px" }} className="text-light-gray">
        vs
      </span>{" "}
      <Emoji emojis={market1Symbols.join("")} />
    </div>
  );
};

const RewardsRemainingBox = ({ rewardsRemaining }: { rewardsRemaining: bigint }) => {
  const { isMobile } = useMatchBreakpoints();
  return (
    <Box
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        placeItems: "center",
        padding: "1em",
      }}
    >
      <div
        className={`uppercase ${isMobile ? "text-2xl" : "text-3xl"} text-light-gray tracking-widest text-center`}
      >
        Rewards remaining
      </div>
      <div
        className={`uppercase font-forma ${isMobile ? "text-4xl" : "text-6xl lg:text-7xl xl:text-8xl"} text-white`}
      >
        <FormattedNumber value={rewardsRemaining} nominalize />
      </div>
    </Box>
  );
};

const Desktop: React.FC<Props> = ({ arenaInfo, market0, market1 }) => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gridTemplateColumns: "1fr 0.65fr 0.85fr 1fr",
        height: "100%",
        width: "100%",
        padding: "2em",
        gap: "2em",
      }}
    >
      <Box className="grid place-items-center">
        <EmojiTitle
          market0Symbols={market0.market.symbolEmojis}
          market1Symbols={market1.market.symbolEmojis}
        />
      </Box>
      <Box className="col-start-2 col-end-4 text-5xl lg:text-6xl xl:text-7xl grid place-items-center">
        <Countdown
          startTime={arenaInfo.arenaInfo.startTime / 1000n / 1000n}
          duration={arenaInfo.arenaInfo.duration / 1000n / 1000n}
        />
      </Box>
      <RewardsRemainingBox rewardsRemaining={arenaInfo.arenaInfo.rewardsRemaining} />
      <Box className="col-start-1 col-end-3"></Box>
      <Box className="col-start-3 col-end-5"></Box>
    </div>
  );
};

const BottomNavigationItem = ({
  emoji,
  text,
  onClick,
}: {
  emoji: string;
  text: string;
  onClick?: () => void;
}) => {
  return (
    <div onClick={onClick} className="flex flex-col place-items-center">
      <Emoji emojis={emoji} />
      <div className="uppercase tracking-widest text-light-gray">{text}</div>
    </div>
  );
};

const BottomNavigation = () => {
  return (
    <div
      className="fixed bottom-0 w-[100%] border-solid border-t-[1px] border-dark-gray h-[4em] bg-black/50"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        placeItems: "center",
      }}
    >
      <BottomNavigationItem emoji={emoji("smiling face with horns")} text="enter" />
      <BottomNavigationItem emoji={emoji("ninja")} text="profile" />
      <BottomNavigationItem emoji={emoji("left speech bubble")} text="chat" />
      <BottomNavigationItem emoji={emoji("books")} text="info" />
    </div>
  );
};

const Mobile: React.FC<Props> = ({ arenaInfo, market0, market1 }) => {
  return (
    <>
      <div className="flex flex-col gap-[1em] h-[100%] w-[100%] p-[1em]">
        <Box className="grid place-items-center gap-[1em] py-[1em]">
          <EmojiTitle
            market0Symbols={market0.market.symbolEmojis}
            market1Symbols={market1.market.symbolEmojis}
          />
          <div className="text-4xl">
            <Countdown
              startTime={arenaInfo.arenaInfo.startTime / 1000n / 1000n}
              duration={arenaInfo.arenaInfo.duration / 1000n / 1000n}
            />
          </div>
        </Box>
        <RewardsRemainingBox rewardsRemaining={arenaInfo.arenaInfo.rewardsRemaining} />
        <Box className="h-[500px]"></Box>
        <Box className="h-[500px]"></Box>
      </div>
      {createPortal(<BottomNavigation />, document.body)}
    </>
  );
};

export const ArenaClient = (props: Props) => {
  const { isMobile } = useMatchBreakpoints();
  return isMobile ? <Mobile {...props} /> : <Desktop {...props} />;
};
