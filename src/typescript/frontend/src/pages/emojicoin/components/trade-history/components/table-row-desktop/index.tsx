import React from "react";

import { useTooltip } from "hooks";

import { Flex, Text, Tr, Td } from "components";

import { TableRowDesktopProps } from "./types";

const TableRowDesktop: React.FC<TableRowDesktopProps> = ({ item }) => {
  const { targetRef, tooltip } = useTooltip(
    <Text color="black" textScale="pixelHeading4" textTransform="uppercase">
      {item.rank}
    </Text>,
    {
      placement: "top",
    },
  );

  return (
    <Tr>
      <Td>
        <Flex justifyContent="center">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ref={targetRef}>
            {item.rankIcon}
          </Text>
          {tooltip}
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.apt}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.emoji}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.type}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.date}
          </Text>
        </Flex>
      </Td>
      <Td>
        <Flex justifyContent="end">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.transaction}
          </Text>
        </Flex>
      </Td>
    </Tr>
  );
};

export default TableRowDesktop;
