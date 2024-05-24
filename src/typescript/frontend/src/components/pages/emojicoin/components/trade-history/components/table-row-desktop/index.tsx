"use client";

import React from "react";

import { useTooltip } from "hooks";

import { Flex } from "@/containers";
import { Text, Tr, Td } from "components";

import { type TableRowDesktopProps } from "./types";

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
      <Td width={{ _: "12.5%", laptopL: "13%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex px="12px">
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase" ref={targetRef}>
            {item.rankIcon}
          </Text>
          {tooltip}
        </Flex>
      </Td>

      <Td width={{ _: "12.5%", laptopL: "13.5%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.apt}
          </Text>
        </Flex>
      </Td>

      <Td width={{ _: "13%", laptopL: "13.5%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.emoji}
          </Text>
        </Flex>
      </Td>

      <Td width={{ _: "12.5%", laptopL: "13%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.type}
          </Text>
        </Flex>
      </Td>

      <Td width="12.5%" minWidth={{ _: "100px", laptopL: "unset" }}>
        <Flex>
          <Text textScale="bodySmall" color="lightGrey" textTransform="uppercase">
            {item.date}
          </Text>
        </Flex>
      </Td>

      <Td width={{ _: "37%", laptopL: "35%" }} minWidth={{ _: "100px", laptopL: "unset" }}>
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
