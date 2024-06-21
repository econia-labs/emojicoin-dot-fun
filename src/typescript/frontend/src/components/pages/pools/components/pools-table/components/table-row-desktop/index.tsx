import React from "react";

import { useMatchBreakpoints, useTooltip } from "hooks";

import { Flex } from "@containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";
import { toCoinDecimalString } from "lib/utils/decimals";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item, selected, onClick }) => {
  const { isMobile } = useMatchBreakpoints();

  const { targetRef: targetRefPool, tooltip: poolTooltip } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { targetRef: targetRefAllTime, tooltip: allTimeTooltip } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { targetRef: targetRefVol24, tooltip: vol24Tooltip } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { targetRef: targetRefTvl, tooltip: tvlTooltip } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  const { targetRef: targetRefApr, tooltip: aprTooltip } = useTooltip(undefined, {
    placement: "top",
    isEllipsis: true,
  });

  return (
    <Tr hover selected={selected} onClick={onClick}>
      <Td p="7px 12px" width={{ _: "25%", tablet: "11.5%" }}>
        <Flex justifyContent="start">
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            ref={targetRefPool}
          >
            {item.symbol}
          </Text>
          {poolTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width={{ _: "30%", tablet: "26.5%" }}>
        <Flex>
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            ref={targetRefAllTime}
          >
            {toCoinDecimalString(item.allTimeVolume, 2)} APT
          </Text>
          {allTimeTooltip}
        </Flex>
      </Td>

      {!isMobile && (
        <Td p="7px 12px" width="18%">
          <Flex>
            <Text
              textScale="bodySmall"
              color="lightGray"
              textTransform="uppercase"
              ellipsis
              ref={targetRefVol24}
            >
              {toCoinDecimalString(item.dailyVolume, 2)} APT
            </Text>
            {vol24Tooltip}
          </Flex>
        </Td>
      )}

      <Td p="7px 12px" width={{ _: "25%", tablet: "15%" }}>
        <Flex>
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            ref={targetRefTvl}
          >
            {toCoinDecimalString(item.cpammRealReservesQuote * 2, 2)} APT
          </Text>
          {tvlTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width={{ _: "20%", tablet: "29%" }}>
        <Flex justifyContent="end">
          <Text
            textScale="bodySmall"
            color="lightGray"
            textTransform="uppercase"
            ellipsis
            ref={targetRefApr}
          >
            {((item.tvlPerLpCoinGrowth ** 356 - 1) * 100).toFixed(4)}%
          </Text>
          {aprTooltip}
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
