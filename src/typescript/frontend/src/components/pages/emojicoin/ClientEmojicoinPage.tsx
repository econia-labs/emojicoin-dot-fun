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

  useEffect(() => {
    if (props.data) {
      addMarketData(props.data);
      props.data.chats.forEach((v) => addChatEvents({ data: v }));
      props.data.swaps.forEach((v) => addSwapEvents({ data: v }));
    }
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [props?.data]);

  return (
    <Box pt="85px">
      <ClientsSlider />
      <MainInfo data={props.data} />
      {isLaptopL ? <DesktopGrid data={props.data} /> : <MobileGrid data={props.data} />}
    </Box>
  );
};

export default ClientEmojicoinPage;
