import React from "react";
import { useScramble } from "use-scramble";

import { translationFunction } from "context/language-context";
import { useMatchBreakpoints } from "hooks";

import { FlexGap, Flex } from "@containers";
import { Text } from "components/text";
import Info from "components/info";
import { Arrows } from "components/svg";

import { type TableHeaderProps } from "./types";

const TableHeader: React.FC<TableHeaderProps> = ({ item, isLast, onClick }) => {
  const { t } = translationFunction();
  const { isMobile } = useMatchBreakpoints();

  const { ref, replay } = useScramble({
    text: `${t(item.text)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <Flex>
      <FlexGap
        cursor={item.sortBy ? "pointer" : undefined}
        gap="10px"
        alignItems="center"
        width="fit-content"
        onClick={onClick}
        onMouseEnter={replay}
        ellipsis
      >
        {isLast && (
          <Info>
            <Text
              textScale="pixelHeading4"
              lineHeight="20px"
              color="black"
              textTransform="uppercase"
            >
              <FlexGap gap=".2rem" justifyContent="space-between">
                <span>DPR:</span>
                <span>Daily Percentage Return</span>
              </FlexGap>
            </Text>
            <Text
              textScale="pixelHeading4"
              lineHeight="20px"
              color="black"
              textTransform="uppercase"
            >
              <FlexGap gap=".2rem" justifyContent="space-between">
                <span>WPR:</span>
                <span>Weekly Percentage Return</span>
              </FlexGap>
            </Text>
            <Text
              textScale="pixelHeading4"
              lineHeight="20px"
              color="black"
              textTransform="uppercase"
            >
              <FlexGap gap=".2rem" justifyContent="space-between">
                <span>APR:</span>
                <span>Annual Percentage Return</span>
              </FlexGap>
            </Text>
          </Info>
        )}
        <Text
          textScale="bodyLarge"
          textTransform="uppercase"
          color="econiaBlue"
          $fontWeight="regular"
          ellipsis
          ref={ref}
        >
          {t(item.text)}
        </Text>
        {item.sortBy && !isMobile ? (
          <Flex>
            <Arrows color="econiaBlue" />
          </Flex>
        ) : null}
      </FlexGap>
    </Flex>
  );
};

export default TableHeader;
