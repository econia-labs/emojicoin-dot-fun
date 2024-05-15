"use client";

import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Box } from "@/containers";
import { ClientsSlider } from "components";

import MainInfo from "./components/main-info";
import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";

const Emojicoin: React.FC = () => {
  const { isLaptopL } = useMatchBreakpoints();

  return (
    <Box pt="85px">
      <ClientsSlider />

      <MainInfo />

      {isLaptopL ? <DesktopGrid /> : <MobileGrid />}
    </Box>
  );
};

export default Emojicoin;
