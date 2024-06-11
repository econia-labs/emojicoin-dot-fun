"use client";

import React, { useEffect } from "react";

import { useMatchBreakpoints } from "hooks";

import { Box } from "@containers";

import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type EmojicoinProps } from "./types";
import { useEventStore } from "context/store-context";
import TextCarousel from "components/text-carousel/TextCarousel";
import MainInfo from "./components/main-info/MainInfo";

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { isLaptopL } = useMatchBreakpoints();
  const {
    addMarketData,
    addChatEvents,
    addSwapEvents,
    addPeriodicStateEvents,
    maybeInitializeMarket,
  } = useEventStore((s) => s);

  useEffect(() => {
    if (props.data) {
      maybeInitializeMarket(props.data.marketID);
      addMarketData(props.data);
      addChatEvents({ data: props.data.chats, sorted: true });
      addSwapEvents({ data: props.data.swaps, sorted: true });
      addPeriodicStateEvents({ data: props.data.candlesticks, sorted: true });
      console.debug(props.data);
      console.debug(props.data.chats);
      console.debug(props.data.swaps);
      console.debug(props.data.candlesticks);
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
