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
import { toUniqueHomogenousEvents } from "@sdk/emojicoin_dot_fun/events";
import { marketViewToLatestBars } from "@sdk/utils/candlestick-bars";

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { isLaptopL } = useMatchBreakpoints();
  const addMarketData = useEventStore((s) => s.addMarketData);
  const initializeMarket = useEventStore((s) => s.initializeMarket);
  const loadEvents = useEventStore((s) => s.loadEventsFromServer);
  const setLatestBars = useEventStore((s) => s.setLatestBars);
  const getGuids = useEventStore((s) => s.getGuids);

  useEffect(() => {
    if (props.data) {
      const marketID = props.data.marketID.toString();
      initializeMarket(marketID);
      const events = toUniqueHomogenousEvents(props.data.candlesticks, getGuids());
      if (events) {
        events.swapEvents = props.data.swaps;
        events.chatEvents = props.data.chats;
        loadEvents(events);
      }
      addMarketData(props.data);
      const latestBars = marketViewToLatestBars(props.data.marketView);
      setLatestBars({ marketID, latestBars });
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
