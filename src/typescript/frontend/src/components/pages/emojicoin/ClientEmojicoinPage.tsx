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

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { isLaptopL } = useMatchBreakpoints();
  const { addMarketData, initializeMarket, pushEvents } = useEventStore((s) => s);

  useEffect(() => {
    if (props.data) {
      initializeMarket(props.data.marketID);
      addMarketData(props.data);
      pushEvents(props.data.swaps);
      pushEvents(props.data.candlesticks);
      pushEvents(props.data.chats);
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
