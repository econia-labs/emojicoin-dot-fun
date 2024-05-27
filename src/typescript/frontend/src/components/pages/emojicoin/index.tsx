"use client";

import React from "react";

import { useMatchBreakpoints } from "hooks";

import { Box } from "@/containers";
import { ClientsSlider } from "components";

import MainInfo from "./components/main-info";
import DesktopGrid from "./components/desktop-grid";
import MobileGrid from "./components/mobile-grid";
import { type EmojicoinProps } from "./types";
import { EmojiNotFound } from "./components/emoji-not-found";

const Emojicoin = (props: EmojicoinProps) => {
  const { isLaptopL } = useMatchBreakpoints();

  return (
    <Box pt="85px">
      <ClientsSlider />

      {typeof props.data !== "undefined" ? (
        <>
          <MainInfo data={props.data} />
          {isLaptopL ? <DesktopGrid /> : <MobileGrid />}
        </>
      ) : (
        <EmojiNotFound />
      )}
    </Box>
  );
};

export default Emojicoin;
