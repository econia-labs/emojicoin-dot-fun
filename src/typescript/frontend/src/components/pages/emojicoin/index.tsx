"use client";

import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Box } from "@/containers";
import { ClientsSlider } from "components";

import MainInfo from "./components/main-info";
import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type ChartDataProps } from "components/charts/types";
import Script from "next/script";

export interface EmojicoinProps extends ChartDataProps {}

const Emojicoin = (props: EmojicoinProps) => {
  const { isLaptopL } = useMatchBreakpoints();
  const [isScriptReady, setIsScriptReady] = React.useState(false);

  <Script
    src="@/lib/datafeeds/udf/dist/bundle.js"
    strategy="lazyOnload"
    onLoad={() => {
      setIsScriptReady(true);
    }}
  />;

  return (
    <Box pt="85px">
      <ClientsSlider />

      <MainInfo />

      {isLaptopL ? (
        <DesktopGrid {...props} isScriptReady={isScriptReady} />
      ) : (
        <MobileGrid {...props} isScriptReady={isScriptReady} />
      )}
    </Box>
  );
};

export default Emojicoin;
