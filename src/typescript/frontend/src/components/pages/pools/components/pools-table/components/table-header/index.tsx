import React from "react";
import { useScramble } from "use-scramble";

import { useTranslation } from "context";
import { useMatchBreakpoints } from "hooks";

import { FlexGap, Flex } from "@/containers";
import { Text } from "components/text";

import { Arrows } from "components/svg";

import { type TableHeaderProps } from "./types";
import { type DataType } from "../../types";

const TableHeader: React.FC<TableHeaderProps> = ({ item, isLast, sortData }) => {
  const { t } = useTranslation();
  const { isMobile } = useMatchBreakpoints();

  const { ref, replay } = useScramble({
    text: `${t(item.text)}`,
    overdrive: false,
    speed: 0.5,
  });

  return (
    <Flex justifyContent={isLast ? "end" : undefined}>
      <FlexGap
        cursor={item.sortBy ? "pointer" : undefined}
        gap="10px"
        alignItems="center"
        width="fit-content"
        onClick={item.sortBy ? () => sortData(item.sortBy as Exclude<keyof DataType, "pool">) : () => {}}
        onMouseEnter={replay}
        ellipsis
      >
        <Text
          textScale={{ _: "bodySmall", tablet: "bodyLarge" }}
          textTransform="uppercase"
          color="econiaBlue"
          $fontWeight="regular"
          ellipsis
          ref={ref}
        >
          {t(item.text)}
        </Text>
        {item.sortBy && !isMobile ? (
          <Flex my="-3px">
            <Arrows width="15px" color="econiaBlue" />
          </Flex>
        ) : null}
      </FlexGap>
    </Flex>
  );
};

export default TableHeader;
