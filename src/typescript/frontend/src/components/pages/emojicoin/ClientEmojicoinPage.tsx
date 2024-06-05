"use client";

import React, { useEffect } from "react";

import { useMatchBreakpoints } from "hooks";

import { Box } from "@containers";
import { ClientsSlider } from "components";

import MainInfo from "./components/main-info";
import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type EmojicoinProps } from "./types";
import { useEventStore } from "context/store-context";

const ClientEmojicoinPage = (props: EmojicoinProps) => {
  const { isLaptopL } = useMatchBreakpoints();
  const { addMarketData, addChatEvents, addSwapEvents } = useEventStore((s) => s);
  const marketData = useEventStore((s) => s.getMarket(props.data.marketID).marketData);
  const swapEvents = useEventStore((s) => s.getMarket(props.data.marketID).swapEvents);
  const chatEvents = useEventStore((s) => s.getMarket(props.data.marketID).chatEvents);

  useEffect(() => {
    if (props.data) {
      addMarketData(props.data);
      props.data.chats.forEach(addChatEvents);
      props.data.swaps.forEach(addSwapEvents);
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props?.data]);

  useEffect(() => {
    console.log("client emojicoin page sees the change in marketData :)", marketData);
  }, [marketData]);

  useEffect(() => {
    console.log("client emojicoin page sees the change in swapEvents :)", swapEvents);
  }, [swapEvents]);

  useEffect(() => {
    console.log("client emojicoin page sees the change in chatEvents :)", chatEvents);
  }, [chatEvents]);

  return (
    <Box pt="85px">
      <ClientsSlider />
      <MainInfo data={props.data} />
      {isLaptopL ? <DesktopGrid data={props.data} /> : <MobileGrid data={props.data} />}
    </Box>
  );
};

export default ClientEmojicoinPage;
