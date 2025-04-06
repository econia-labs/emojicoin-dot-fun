"use client";

import type { ClassValue } from "clsx";
import { Countdown } from "components/Countdown";
import { FormattedNumber } from "components/FormattedNumber";
import { useEventStore } from "context/event-store-context/hooks";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useEffectOnce } from "react-use";

import ChartContainer from "@/components/charts/ChartContainer";
import { useMatchBreakpoints } from "@/hooks/index";
import { useLatestMeleeID } from "@/hooks/use-latest-melee-id";
import { STRUCT_STRINGS } from "@/sdk/index";
import { useSyncArenaEscrows } from "@/store/escrow/hooks";
import { globalUserTransactionStore } from "@/store/transaction/store";

import { BottomNavigation, TabContainer } from "./tabs";
import {
  type ArenaProps,
  type ArenaPropsWithPositionHistoryAndEmojiData,
  Box,
  EmojiTitle,
} from "./utils";

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

const chartBoxClassName: ClassValue = "relative w-full h-full col-start-1 col-end-3";

const Desktop = React.memo((props: ArenaPropsWithPositionHistoryAndEmojiData) => {
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
        <EmojiTitle />
      </Box>
      <Box className="col-start-2 col-end-4 text-5xl lg:text-6xl xl:text-7xl grid place-items-center">
        <Countdown startTime={arenaInfo.startTime} duration={arenaInfo.duration / 1000n / 1000n} />
      </Box>
      <RewardsRemainingBox rewardsRemaining={arenaInfo.rewardsRemaining} />
      <Box className={chartBoxClassName}>
        <ChartContainer
          symbol={market0.market.symbolData.symbol}
          secondarySymbol={market1.market.symbolData.symbol}
          className="w-full h-full"
        />
      </Box>
      <Box className="col-start-3 col-end-5 h-[100%]">
        <TabContainer {...props} />
      </Box>
    </div>
  );
});
// Necessary to add a display name because of the React.memo wrapper.
Desktop.displayName = "Desktop";

const Mobile = React.memo((props: ArenaPropsWithPositionHistoryAndEmojiData) => {
  const { arenaInfo, market0, market1 } = props;
  return (
    <>
      <div className="flex flex-col gap-[1em] h-[100%] w-[100%] p-[1em]">
        <Box className="grid place-items-center gap-[1em] py-[1em]">
          <EmojiTitle />
          <div className="text-4xl">
            <Countdown
              startTime={arenaInfo.startTime}
              duration={arenaInfo.duration / 1000n / 1000n}
            />
          </div>
        </Box>
        <RewardsRemainingBox rewardsRemaining={arenaInfo.rewardsRemaining} />
        <Box className="h-[500px]">
          <Box className={chartBoxClassName}>
            <ChartContainer
              symbol={market0.market.symbolData.symbol}
              secondarySymbol={market1.market.symbolData.symbol}
              className="w-full h-full"
            />
          </Box>
        </Box>
      </div>
      {createPortal(<BottomNavigation {...props} />, document.body)}
    </>
  );
});
// Necessary to add a display name because of the React.memo wrapper.
Mobile.displayName = "Mobile";

/**
 * When a melee ends, all clients will refresh at once. To avoid hammering the indexer in case of huge traffic, stagger
 * the requests by randomly delaying them for 1-5 seconds. Getting the new melee data is a once a day thing, so it's
 * fine if this is delayed by a few seconds for a client.
 *
 * In a development environment, this is just a flat, shorter amount of time.
 */
const randomlyStaggeredRefreshDelay = () =>
  process.env.NODE_ENV === "development" ? 777 : 1000 + Math.random() * 4000;

export const ArenaClient = (props: ArenaProps) => {
  const { isMobile } = useMatchBreakpoints();
  const router = useRouter();
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const subscribeEvents = useEventStore((s) => s.subscribeEvents);
  const latestTxnEvents = globalUserTransactionStore.getState().latestResponse?.events;
  const latestMeleeID = useLatestMeleeID();

  useSyncArenaEscrows();

  useEffectOnce(() => {
    subscribeEvents(["Chat", "MarketLatestState"], { arenaBaseEvents: true });
  });

  useEffect(() => {
    loadArenaInfoFromServer(props.arenaInfo);
    loadMarketStateFromServer([props.market0]);
    loadMarketStateFromServer([props.market1]);
  }, [loadArenaInfoFromServer, loadMarketStateFromServer, props]);

  // Whenever the melee ID updates, wait a short, random amount of time so that the processor has time to process the
  // new changes. Then refresh the page.
  useEffect(() => {
    const userCrankedMelee = !!latestTxnEvents?.find(
      ({ type }) => type === STRUCT_STRINGS.ArenaMeleeEvent
    );
    const newMeleeID = latestMeleeID > props.arenaInfo.meleeID;
    const shouldRefresh = userCrankedMelee || newMeleeID;

    const timeout = shouldRefresh
      ? setTimeout(() => {
          router.refresh();
        }, randomlyStaggeredRefreshDelay())
      : undefined;

    return () => clearTimeout(timeout);
  }, [latestTxnEvents, latestMeleeID, props.arenaInfo.meleeID, router]);

  return isMobile ? <Mobile {...props} /> : <Desktop {...props} />;
};
