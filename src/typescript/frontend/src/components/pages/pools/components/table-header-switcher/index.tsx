"use client";

import React, { useState } from "react";
import { useScramble } from "use-scramble";

import { translationFunction } from "context/language-context";
import { Flex, FlexGap } from "@/containers";
import { Text } from "components/text";

import { type TableHeaderSwitcherPops } from "./types";

const TableHeaderSwitcher: React.FC<TableHeaderSwitcherPops> = ({ title1, title2 }) => {
  const [isActive, setIsActive] = useState(true);
  const { t } = translationFunction();

  const { ref: ref1, replay: replay1 } = useScramble({
    text: `${t(title1)}`,
    overdrive: false,
    speed: 0.5,
  });

  const { ref: ref2, replay: replay2 } = useScramble({
    text: `${t(title2)}`,
    overdrive: false,
    speed: 0.5,
  });

  const clickHandler = () => {
    setIsActive(!isActive);
  };

  return (
    <FlexGap gap="8px" width="fit-content">
      <Flex cursor="pointer" onMouseOver={replay1}>
        <Text
          textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }}
          textTransform="uppercase"
          color={isActive ? "lightGrey" : "darkGrey"}
          onClick={clickHandler}
          ref={ref1}
        ></Text>
      </Flex>

      <Flex cursor="pointer" onMouseOver={replay2}>
        <Text
          textScale={{ _: "pixelHeading4", laptopL: "pixelHeading3" }}
          textTransform="uppercase"
          color={isActive ? "darkGrey" : "lightGrey"}
          onClick={clickHandler}
          ref={ref2}
        ></Text>
      </Flex>
    </FlexGap>
  );
};

export default TableHeaderSwitcher;
