import React from "react";

import { useTooltip } from "hooks";

import { Flex } from "@/containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item }) => {
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
    <Tr hover>
      <Td p="7px 12px" width="11.5%">
        <Flex justifyContent="start">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefPool}>
            {item.pool}
          </Text>
          {poolTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="26.5%">
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefAllTime}>
            {item.allTime} APT
          </Text>
          {allTimeTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="18%">
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefVol24}>
            {item.vol24} APT
          </Text>
          {vol24Tooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="15%">
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefTvl}>
            {item.tvl} APT
          </Text>
          {tvlTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="29%">
        <Flex justifyContent="end">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefApr}>
            {item.apr}%
          </Text>
          {aprTooltip}
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
