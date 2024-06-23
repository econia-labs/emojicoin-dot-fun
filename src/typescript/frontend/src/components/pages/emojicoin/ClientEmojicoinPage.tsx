"use client";

import React, { useEffect } from "react";

import { useMatchBreakpoints } from "hooks";

import { Box } from "@containers";

import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type EmojicoinProps } from "./types";
import { useEventStore } from "context/websockets-context";
import TextCarousel from "components/text-carousel/TextCarousel";
import MainInfo from "./components/main-info/MainInfo";
import { getLatestBars } from "@store/event-utils";
import { toHomogenousEvents } from "@sdk/emojicoin_dot_fun/events";

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { isLaptopL } = useMatchBreakpoints();
  const addMarketData = useEventStore((s) => s.addMarketData);
  const initializeMarket = useEventStore((s) => s.initializeMarket);
  const pushEvents = useEventStore((s) => s.pushEvents);
  const setLatestBars = useEventStore((s) => s.setLatestBars);
  const market = useEventStore((s) => s.markets.get(props.data?.marketID.toString()));

  useEffect(() => {
    if (props.data) {
      initializeMarket(props.data.marketID);
      // Latest bars need to be set before calling `pushEvents`.
      const events = toHomogenousEvents(props.data.candlesticks, new Set<string>());
      if (events) {
        events.swapEvents = props.data.swaps;
        events.chatEvents = props.data.chats;
        pushEvents({ eventsIn: events, latestBarData: props.data.latestBarData });
      }

      // setLatestBars({
      // marketID: props.data.marketID.toString(),
      // latestBarData: props.data.latestBarData,
      // });
      addMarketData(props.data);
      // pushEvents(props.data.candlesticks);
      // pushEvents(props.data.swaps);
      // pushEvents(props.data.chats);
      if (market) {
        const latestBars = getLatestBars(market);
        console.log(latestBars);
      }
    }

    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props?.data]);

  return (
    <Box pt="85px">
      <TextCarousel />
      <MainInfo data={props.data} />
      {isLaptopL ? <DesktopGrid data={props.data} /> : <MobileGrid data={props.data} />}
    </Box>
  );
};

export default ClientEmojicoinPage;
