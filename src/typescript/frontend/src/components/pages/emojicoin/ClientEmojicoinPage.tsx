"use client";

import React, { useEffect } from "react";
import { useMatchBreakpoints } from "hooks";
import { Box } from "@containers";
import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type EmojicoinProps } from "./types";
import { useEventStore } from "context/event-store-context";
import MainInfo from "./components/main-info/MainInfo";
import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";
import { type BrokerEvent } from "@/broker/types";
import { marketToLatestBars } from "@/store/event/candlestick-bars";
import { DefaultProfiler } from "on-render";

const EVENT_TYPES: BrokerEvent[] = ["Chat", "PeriodicState", "Swap"];

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { isTablet, isMobile } = useMatchBreakpoints();
  const loadMarketStateFromServer = useEventStore((s) => s.loadMarketStateFromServer);
  const loadEventsFromServer = useEventStore((s) => s.loadEventsFromServer);
  const setLatestBars = useEventStore((s) => s.setLatestBars);

  useEffect(() => {
    const { chats, swaps, state, marketView } = props.data;
    loadMarketStateFromServer([state]);
    loadEventsFromServer([...chats, ...swaps]);
    const latestBars = marketToLatestBars(marketView);
    setLatestBars({ marketMetadata: state.market, latestBars });

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props.data]);

  useReliableSubscribe({ eventTypes: EVENT_TYPES });

  return (
    <Box>
      <DefaultProfiler id="[market]/page.tsx: MainInfo">
        <MainInfo data={props.data} />
      </DefaultProfiler>
      <DefaultProfiler id={`[market]/page.tsx: ${isTablet || isMobile ? "Mobile" : "Desktop"}Grid`}>
        {isTablet || isMobile ? (
          <MobileGrid data={props.data} />
        ) : (
          <DesktopGrid data={props.data} />
        )}
      </DefaultProfiler>
    </Box>
  );
};

export default ClientEmojicoinPage;
