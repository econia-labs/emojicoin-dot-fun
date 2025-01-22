"use client";

import { useMatchBreakpoints } from "@hooks/index";
import type { ArenaInfoModel, MarketStateModel } from "@sdk/indexer-v2/types";
import { Countdown } from "components/Countdown";
import { FormattedNumber } from "components/FormattedNumber";
import type { CSSProperties } from "react";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { emoji } from "utils";
import { Emoji } from "utils/emoji";

type Props = {
  arenaInfo: ArenaInfoModel;
  market0: MarketStateModel;
  market1: MarketStateModel;
};

type Tab = {
  name: string;
  emoji: string;
  element: React.ReactNode;
};

const TABS: Tab[] = [
  {
    name: "Position",
    emoji: emoji("smiling face with horns"),
    element: <div className="text-ec-blue">tab number one</div>,
  },
  {
    name: "Profile",
    emoji: emoji("ninja"),
    element: <div className="text-ec-blue">tab number two</div>,
  },
  {
    name: "Chat",
    emoji: emoji("left speech bubble"),
    element: <div className="text-ec-blue">tab number three</div>,
  },
  {
    name: "Info",
    emoji: emoji("books"),
    element: <div className="text-ec-blue">tab number four</div>,
  },
];

const Box: React.FC<React.PropsWithChildren<{ className?: string; style?: CSSProperties }>> = ({
  children,
  className,
  style,
}) => {
  return (
    <div
      className={`border-solid border-[1px] border-dark-gray rounded-[3px] bg-black/75 ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

const TabContainer = ({ tabs }: { tabs: Tab[] }) => {
  const [selectedTab, setSelectedTab] = useState(tabs.length > 0 ? tabs[0].name : undefined);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr auto",
      }}
    >
      <div className="relative flex flex-row mt-[.5em]">
        {tabs.map((t) => {
          return (
            <div className="flex flex-row" key={`tab-${t.name}`}>
              <div className="w-[1em] h-[100%] border-solid border-b-[2px] border-dark-gray"></div>
              <div className="flex flex-col">
                <div
                  onClick={() => setSelectedTab(t.name)}
                  className={`flex flex-row gap-[.2em] uppercase pixel-heading-3 border-solid ${t.name === selectedTab ? "rounded-t-[6px] border-t-dark-gray border-x-dark-gray border-x-[2px] border-t-[2px] text-white" : "mt-[2px] text-light-gray"}`}
                  style={
                    t.name !== selectedTab
                      ? {
                          paddingLeft: "calc(.5em + 2px)",
                          paddingRight: "calc(.5em + 2px)",
                        }
                      : {
                          paddingLeft: ".5em",
                          paddingRight: ".5em",
                        }
                  }
                >
                  <div>{t.name}</div> <Emoji className="text-[.75em]" emojis={t.emoji} />
                </div>
                {t.name === selectedTab ? (
                  <div className="flex flex-row justify-between">
                    <div className="w-[2px] bg-dark-gray h-[2px]"></div>
                    <div className="w-[2px] bg-dark-gray h-[2px]"></div>
                  </div>
                ) : (
                  <div className="w-[100%] bg-dark-gray h-[2px]"></div>
                )}
              </div>
            </div>
          );
        })}
        <div className="w-[100%] h-[100%] border-solid border-b-[2px] border-dark-gray"></div>
      </div>
      <div>{tabs.find((t) => t.name === selectedTab)?.element}</div>
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
      {TABS.map((t) => (
        <BottomNavigationItem emoji={t.emoji} text={t.name} key={`navigation-item-${t.name}`} />
      ))}
    </div>
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
      <Box className="col-start-3 col-end-5">
        <TabContainer tabs={TABS} />
      </Box>
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
