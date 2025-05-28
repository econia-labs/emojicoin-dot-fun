"use client";

import type { ClassValue } from "clsx";
import { Countdown } from "components/Countdown";
import { useEventStore } from "context/event-store-context/hooks";
import { cn } from "lib/utils/class-name";
import React, { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import ChartContainer from "@/components/charts/ChartContainer";
import { useMatchBreakpoints } from "@/hooks/index";
import { useCurrentMeleeInfo } from "@/hooks/use-current-melee-info";

import RewardsRemainingBox from "./RewardsRemainingBox";
import { MobileNavigation, TabContainer } from "./tabs";
import type { ArenaProps, ArenaPropsWithVaultBalance } from "./utils";
import { Box, EmojiTitle } from "./utils";

const chartBoxClassName: ClassValue = "relative w-full h-full col-start-1 col-end-3";

const Desktop = React.memo((props: ArenaProps) => {
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
        <EmojiTitle market0Delta={props.market0Delta} market1Delta={props.market1Delta} />
      </Box>
      <Box
        className={cn(
          "col-span-2 text-4xl",
          "[@media(min-width:860px)_and_(max-width:1024px)]:text-5xl lg:text-6xl xl:text-7xl",
          "grid place-items-center"
        )}
      >
        <Countdown startTime={arenaInfo.startTime} duration={arenaInfo.duration / 1000n / 1000n} />
      </Box>
      <RewardsRemainingBox />
      <Box className={cn(chartBoxClassName, "min-h-[440px]")}>
        <ChartContainer
          symbol={market0.market.symbolData.symbol}
          secondarySymbol={market1.market.symbolData.symbol}
          className="w-full h-full"
        />
      </Box>
      <Box className="col-start-3 col-end-5 min-h-[440px]">
        <TabContainer {...props} />
      </Box>
    </div>
  );
});
// Necessary to add a display name because of the React.memo wrapper.
Desktop.displayName = "Desktop";

const Mobile = React.memo((props: ArenaProps) => {
  const { arenaInfo, market0, market1 } = props;
  return (
    <>
      <div className="flex flex-col gap-[1em] h-[100%] w-[100%] p-[1em]">
        <Box className="grid place-items-center gap-[1em] py-[1em]">
          <EmojiTitle market0Delta={props.market0Delta} market1Delta={props.market1Delta} />
          <div className="text-4xl">
            <Countdown
              startTime={arenaInfo.startTime}
              duration={arenaInfo.duration / 1000n / 1000n}
            />
          </div>
        </Box>
        <RewardsRemainingBox />
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
      {createPortal(<MobileNavigation {...props} />, document.body)}
    </>
  );
});
// Necessary to add a display name because of the React.memo wrapper.
Mobile.displayName = "Mobile";

export const ArenaClient = (props: ArenaPropsWithVaultBalance) => {
  const { isMobile } = useMatchBreakpoints();
  const loadArenaInfoFromServer = useEventStore((s) => s.loadArenaInfoFromServer);
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const loadVaultBalanceFromServer = useEventStore((s) => s.loadVaultBalanceFromServer);
  const { meleeInfo: arenaInfo, market0, market1 } = useCurrentMeleeInfo();

  useEffect(() => {
    loadArenaInfoFromServer(props.arenaInfo);
    loadMarketStateFromServer([props.market0]);
    loadMarketStateFromServer([props.market1]);
    loadVaultBalanceFromServer(props.vaultBalance);
  }, [loadArenaInfoFromServer, loadMarketStateFromServer, loadVaultBalanceFromServer, props]);

  const outdatedMeleeInfo = useMemo(
    () => props.arenaInfo.meleeID !== arenaInfo?.meleeID,
    [props.arenaInfo.meleeID, arenaInfo?.meleeID]
  );

  return isMobile ? (
    <Mobile
      arenaInfo={arenaInfo ?? props.arenaInfo}
      market0={market0 ?? props.market0}
      market1={market1 ?? props.market1}
      // If the props melee info is outdated, the melee has changed while the application was open.
      // Thus, the two markets' changes in price will be 0%, so just manually pass 0, otherwise, use the data
      // fetched from the fullnode in the props data.
      market0Delta={outdatedMeleeInfo ? 0 : props.market0Delta}
      market1Delta={outdatedMeleeInfo ? 0 : props.market1Delta}
    />
  ) : (
    <Desktop
      arenaInfo={arenaInfo ?? props.arenaInfo}
      market0={market0 ?? props.market0}
      market1={market1 ?? props.market1}
      // See the explanation above in <Mobile /> props for the two delta fields below.
      market0Delta={outdatedMeleeInfo ? 0 : props.market0Delta}
      market1Delta={outdatedMeleeInfo ? 0 : props.market1Delta}
    />
  );
};
