import React from "react";

import { useTooltip } from "hooks";

import { Flex, Text, Tr, Td } from "components";

import { TableRowDesktopProps } from "./types";

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
      <Td p="7px 12px" width="130px">
        <Flex justifyContent="start">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefPool}>
            {item.pool}
          </Text>
          {poolTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="26%">
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefAllTime}>
            {item.allTime} APT
          </Text>
          {allTimeTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="150px">
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefVol24}>
            {item.vol24} APT
          </Text>
          {vol24Tooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="33%">
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ellipsis ref={targetRefTvl}>
            {item.tvl} APT
          </Text>
          {tvlTooltip}
        </Flex>
      </Td>

      <Td p="7px 12px" width="130px">
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
