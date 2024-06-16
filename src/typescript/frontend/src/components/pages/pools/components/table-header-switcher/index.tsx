"use client";

import React, { useEffect, useState } from "react";
import { useScramble } from "use-scramble";

import { translationFunction } from "context/language-context";
import { Flex, FlexGap } from "@containers";
import { Text } from "components/text";

import { type TableHeaderSwitcherProps } from "./types";

const TableHeaderSwitcher: React.FC<TableHeaderSwitcherProps> = ({ title1, title2, onSelect }) => {
  const [selectedTitle, setSelectedTitle] = useState(title1);
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

  useEffect(() => {
    onSelect(selectedTitle);
  }, [selectedTitle, onSelect]);

  return (
    <FlexGap gap="8px" width="fit-content">
      <Flex cursor="pointer" onMouseOver={replay1}>
        <Text
          textScale="pixelHeading3"
          className="font-pixelar text-lg text-blue"
          textTransform="uppercase"
          color={selectedTitle === title1 ? "lightGray" : "darkGray"}
          onClick={() => setSelectedTitle(title1)}
          ref={ref1}
        ></Text>
      </Flex>

      <Flex cursor="pointer" onMouseOver={replay2}>
        <Text
          textScale="pixelHeading3"
          className="font-pixelar text-lg text-blue"
          textTransform="uppercase"
          color={selectedTitle === title2 ? "lightGray" : "darkGray"}
          onClick={() => setSelectedTitle(title2)}
          ref={ref2}
        ></Text>
      </Flex>
    </FlexGap>
  );
};

export default TableHeaderSwitcher;
