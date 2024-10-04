"use client";

import React, { useEffect } from "react";
import { useMatchBreakpoints } from "hooks";
import { Box } from "@containers";
import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type EmojicoinProps } from "./types";
import { useEventStore } from "context/event-store-context";
import TextCarousel from "components/text-carousel/TextCarousel";
import MainInfo from "./components/main-info/MainInfo";
import { useReliableSubscribe } from "@hooks/use-reliable-subscribe";
import { type BrokerEvent } from "@/broker/types";
import { marketToLatestBars } from "@/store/event/candlestick-bars";

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
    <Box pt="85px">
      <TextCarousel />
      <MainInfo data={props.data} />
      {isTablet || isMobile ? (
        <MobileGrid geoblocked={props.geoblocked} data={props.data} />
      ) : (
        <DesktopGrid geoblocked={props.geoblocked} data={props.data} />
      )}
    </Box>
  );
};

export default ClientEmojicoinPage;
