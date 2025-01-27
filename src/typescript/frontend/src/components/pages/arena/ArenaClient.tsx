"use client";

import { useMatchBreakpoints } from "@hooks/index";
import { Countdown } from "components/Countdown";
import { FormattedNumber } from "components/FormattedNumber";
import React from "react";
import { createPortal } from "react-dom";
import { emoji } from "utils";
import { Box, EmojiTitle, type Props } from "./utils";
import { BottomNavigation, TabContainer } from "./tabs";
import { EnterTab } from "./tabs/EnterTab";
import { PriceChartDesktopBox } from "./PriceChart";
import { ProfileTab } from "./tabs/ProfileTab";
import { ChatTab } from "./tabs/ChatTab";
import { InfoTab } from "./tabs/InfoTab";

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

const Desktop: React.FC<Props> = ({
  arenaInfo,
  market0,
  market1,
  candlesticksMarket0,
  candlesticksMarket1,
}) => {
  const tabs = [
    {
      name: "Position",
      emoji: emoji("smiling face with horns"),
      element: <EnterTab {...{ market0, market1 }} />,
    },
    {
      name: "Profile",
      emoji: emoji("ninja"),
      element: <ProfileTab />,
    },
    {
      name: "Chat",
      emoji: emoji("left speech bubble"),
      element: <ChatTab />,
    },
    {
      name: "Info",
      emoji: emoji("books"),
      element: <InfoTab />,
    },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr 2.75fr",
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
      <PriceChartDesktopBox
        {...{ arenaInfo, market0, market1, candlesticksMarket0, candlesticksMarket1 }}
      />
      <Box className="col-start-3 col-end-5">
        <TabContainer tabs={tabs} />
      </Box>
    </div>
  );
};

const Mobile: React.FC<Props> = ({ arenaInfo, market0, market1 }) => {
  const tabs = [
    {
      name: "Position",
      emoji: emoji("smiling face with horns"),
      element: <EnterTab {...{ market0, market1 }} />,
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
      {createPortal(<BottomNavigation tabs={tabs} />, document.body)}
    </>
  );
};

export const ArenaClient = (props: Props) => {
  const { isMobile } = useMatchBreakpoints();
  return isMobile ? <Mobile {...props} /> : <Desktop {...props} />;
};
