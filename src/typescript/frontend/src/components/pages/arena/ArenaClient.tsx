"use client";

import { useMatchBreakpoints } from "@hooks/index";
import { Countdown } from "components/Countdown";
import { FormattedNumber } from "components/FormattedNumber";
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { parseJSON } from "utils";
import { Box, EmojiTitle, type ArenaPropsWithPositionAndHistory, type ArenaProps } from "./utils";
import { BottomNavigation, TabContainer } from "./tabs";
import { PriceChartDesktopBox, PriceChartMobile } from "./PriceChart";
import { useAptos } from "context/wallet-context/AptosContextProvider";
import {
  type ArenaLeaderboardHistoryWithArenaInfoModel,
  type ArenaPositionModel,
} from "@sdk/indexer-v2/types";
import { ROUTES } from "router/routes";
import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";
import { useRouter } from "next/navigation";
import { useLatestMeleeID } from "@hooks/use-latest-melee-id";

const RewardsRemainingBox = ({ rewardsRemaining }: { rewardsRemaining: bigint }) => {
  const { isMobile } = useMatchBreakpoints();
  return (
    <Box className="grid grid-rows-[auto_1fr] place-items-center p-[1em]">
      <div
        className={`uppercase ${isMobile ? "text-2xl" : "text-3xl"} text-light-gray tracking-widest text-center`}
      >
        {"Rewards remaining"}
      </div>
      <div
        className={`uppercase font-forma ${isMobile ? "text-4xl" : "text-6xl lg:text-7xl xl:text-8xl"} text-white`}
      >
        <FormattedNumber value={rewardsRemaining} nominalize />
      </div>
    </Box>
  );
};

const Desktop = (props: ArenaPropsWithPositionAndHistory) => {
  const { arenaInfo, market0, market1 } = props;
  return (
    <div
      className="grid h-[90%] w-full p-[2em] gap-[2em]"
      style={{
        gridTemplateRows: "1fr minmax(0, 3.5fr)",
        gridTemplateColumns: "1fr 0.65fr 0.85fr 1fr",
      }}
    >
      <Box className="grid place-items-center">
        <EmojiTitle
          market0Symbols={market0.market.symbolEmojis}
          market1Symbols={market1.market.symbolEmojis}
        />
      </Box>
      <Box className="col-start-2 col-end-4 text-5xl lg:text-6xl xl:text-7xl grid place-items-center">
        <Countdown startTime={arenaInfo.startTime} duration={arenaInfo.duration / 1000n / 1000n} />
      </Box>
      <RewardsRemainingBox rewardsRemaining={arenaInfo.rewardsRemaining} />
      <PriceChartDesktopBox {...props} />
      <Box className="col-start-3 col-end-5 h-[100%]">
        <TabContainer {...props} />
      </Box>
    </div>
  );
};

const Mobile = (props: ArenaPropsWithPositionAndHistory) => {
  const { arenaInfo, market0, market1 } = props;
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
              startTime={arenaInfo.startTime}
              duration={arenaInfo.duration / 1000n / 1000n}
            />
          </div>
        </Box>
        <RewardsRemainingBox rewardsRemaining={arenaInfo.rewardsRemaining} />
        <Box className="h-[500px]">
          <PriceChartMobile {...props} />
        </Box>
      </div>
      {createPortal(<BottomNavigation {...props} />, document.body)}
    </>
  );
};

export const ArenaClient = (props: ArenaProps) => {
  const { isMobile } = useMatchBreakpoints();
  const { account } = useAptos();
  const router = useRouter();

  // Undefined while loading. Null means no position
  const [position, setPosition] = useState<ArenaPositionModel | undefined | null>(null);
  const [history, setHistory] = useState<ArenaLeaderboardHistoryWithArenaInfoModel[]>([]);

  useReliableSubscribe({ eventTypes: ["Chat"], arena: true });

  const latestMeleeID = useLatestMeleeID();

  useEffect(() => {
    if (latestMeleeID > props.arenaInfo.meleeID) {
      router.refresh();
    }
  }, [latestMeleeID, props.arenaInfo.meleeID, router]);

  const r = useMemo(
    () =>
      isMobile ? (
        <Mobile {...props} {...{ position, setPosition, history, setHistory }} />
      ) : (
        <Desktop {...props} {...{ position, setPosition, history, setHistory }} />
      ),
    [isMobile, props, position, setPosition, history, setHistory]
  );

  useEffect(() => {
    // This is done because account refreshes often and we don't want to refetch
    if (account) {
      setPosition(undefined);
      fetch(`${ROUTES.api.arena.position}/${account.address}`)
        .then((r) => r.text())
        .then(parseJSON<ArenaPositionModel | null>)
        .then((r) => setPosition(r));
      fetch(`${ROUTES.api.arena["historical-positions"]}/${account.address}`)
        .then((r) => r.text())
        .then(parseJSON<ArenaLeaderboardHistoryWithArenaInfoModel[]>)
        .then((r) => setHistory(r));
    }
  }, [account]);

  return r;
};
